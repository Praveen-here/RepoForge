import { randomBytes } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../../config/index.js';
import {
  countCoachQuestionsSince,
  deleteCoachMessages,
  getCoachHintLevel,
  insertCoachExchange,
  listCoachMessages,
} from '../../repositories/coachRepository.js';
import { listSubmissions } from '../../repositories/submissionRepository.js';
import { HttpError } from '../../utils/HttpError.js';
import { readEditableSource, readFile } from '../fileService.js';
import { readRecentLogs } from '../logService.js';
import { getProblem } from '../problemService.js';
import { touchSession } from '../sessionService.js';
import { findLeak, parseSolutionPatch } from './coachGuard.js';
import {
  buildSystemInstruction,
  buildWorkspaceBlock,
  CODE_VISIBLE_FROM_LEVEL,
  MAX_HINT_LEVEL,
  RESPONSE_SCHEMA,
} from './coachPrompt.js';
import { generateJson } from './geminiClient.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_REPLY_LENGTH = 2500;

// The quick-action buttons. Only "hint" moves the user further down the hint ladder.
const ACTIONS = {
  explain: { question: 'Help me understand this problem in simple terms.' },
  start: { question: 'Where should I start debugging?' },
  failing: { question: 'How should I investigate my latest test results?' },
  hint: { question: 'Give me a hint.', nextHint: true },
};

const OFF_TOPIC_REPLY =
  "I can only help with this problem, programming concepts, and using the workspace. What's the bug doing right now?";
const FALLBACK_REPLY =
  "I can't help with that one directly, because working it out yourself is the point. Try reproducing the bug, then tell me what you expected to happen and what happened instead.";

const inFlight = new Set(); // users waiting for a reply: one question at a time per user

function toPublicMessage(row) {
  return { id: row.id, role: row.role, content: row.content, hintLevel: row.hint_level, createdAt: row.created_at };
}

async function remainingToday(userId) {
  const used = await countCoachQuestionsSince(userId, new Date(Date.now() - DAY_MS));
  return Math.max(0, config.coach.maxQuestionsPerDay - used);
}

export async function getCoachState(userId, problemSlug) {
  const problem = await getProblem(problemSlug);
  const [messages, hintLevel, remaining] = await Promise.all([
    listCoachMessages(userId, problem.dbId),
    getCoachHintLevel(userId, problem.dbId),
    remainingToday(userId),
  ]);
  return {
    enabled: Boolean(config.coach.apiKey),
    messages: messages.map(toPublicMessage),
    hintLevel,
    maxHintLevel: MAX_HINT_LEVEL,
    remainingToday: remaining,
  };
}

export async function clearCoachConversation(userId, problemSlug) {
  const problem = await getProblem(problemSlug);
  await deleteCoachMessages(userId, problem.dbId);
}

/** Loads the reference fix for the leak check. It stays on the server. */
async function loadSolution(problemId) {
  try {
    return parseSolutionPatch(await fs.readFile(path.join(config.testsDir, problemId, 'solution.patch'), 'utf8'));
  } catch {
    console.warn(`Coach: no solution.patch for ${problemId}, so the leak check only limits code length`);
    return null;
  }
}

/** Fits the user's code into the size limit, starting with the file they have open. */
function chooseFiles(source, activeFile) {
  const rank = (file) => {
    if (file.path === activeFile) return 0;
    return file.path.startsWith('backend/') ? 1 : 2;
  };
  const ordered = [...source].sort((a, b) => rank(a) - rank(b) || a.path.localeCompare(b.path));

  const files = [];
  const omitted = [];
  let used = 0;
  for (const file of ordered) {
    if (used + file.content.length > config.coach.maxContextChars) {
      omitted.push(file.path);
    } else {
      files.push(file);
      used += file.content.length;
    }
  }
  return { files, omitted };
}

/** Reads what the coach may see. A stopped container shows the "session paused" screen. */
async function loadWorkspace(session) {
  try {
    return await Promise.all([
      readFile(session, session.problem.readme),
      readEditableSource(session),
      readRecentLogs(session),
    ]);
  } catch (error) {
    if (error.statusCode === 404 || error.statusCode === 409) {
      throw new HttpError(410, 'Your environment has stopped. Restart it to continue.');
    }
    throw error;
  }
}

function checkQuestion({ action, message }) {
  if (action !== undefined) {
    if (!Object.hasOwn(ACTIONS, action)) throw new HttpError(400, 'Unknown coach action');
    return ACTIONS[action].question;
  }
  const question = typeof message === 'string' ? message.trim() : '';
  if (!question) throw new HttpError(400, 'Type a question first');
  if (question.length > config.coach.maxQuestionLength) {
    throw new HttpError(400, `Please keep questions under ${config.coach.maxQuestionLength} characters`);
  }
  return question;
}

/** Asks the model, re-asking once if the reply gives too much away. Never returns a leak. */
async function generateSafeReply({ systemInstruction, history, workspace, question, solved, solution }) {
  const finalTurn = (extra = '') => ({
    role: 'user',
    parts: [{ text: `${workspace}\n\nSTUDENT'S MESSAGE:\n${question}${extra}` }],
  });

  let extra = '';
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const result = await generateJson({
      systemInstruction,
      contents: [...history, finalTurn(extra)],
      schema: RESPONSE_SCHEMA,
    });
    const reply = typeof result?.reply === 'string' ? result.reply.trim() : '';

    // The canned text replaces the model's, so nothing off-topic can slip out in its wording.
    if (result?.category === 'off_topic') return OFF_TOPIC_REPLY;

    if (reply) {
      // Once a problem is solved, the answer is no longer a secret.
      const leak = solved ? null : findLeak(reply, solution);
      if (!leak) return reply.slice(0, MAX_REPLY_LENGTH);
      console.warn(`Coach: reply blocked because ${leak} (attempt ${attempt + 1})`);
    }
    extra =
      '\n\n(SYSTEM NOTE: your previous reply gave away too much or was unusable. Reply again with no code, and do not name the exact change. Give only a guiding question.)';
  }
  return FALLBACK_REPLY;
}

/** Answers one question from the user about the problem their session is running. */
export async function askCoach(session, { action, message, activeFile }) {
  if (!config.coach.apiKey) {
    throw new HttpError(503, 'The coach is not set up yet (GEMINI_API_KEY is missing on the server).');
  }
  const question = checkQuestion({ action, message });

  const { userId, problem } = session;
  if (inFlight.has(userId)) throw new HttpError(429, 'The coach is still answering your last question.');
  inFlight.add(userId);

  try {
    if ((await remainingToday(userId)) <= 0) {
      throw new HttpError(429, "You've reached today's coach limit. It resets gradually over the next 24 hours.");
    }
    await touchSession(session);

    const [messages, currentLevel, submissions, solution, [readme, source, logs]] = await Promise.all([
      listCoachMessages(userId, problem.dbId, config.coach.historyMessages),
      getCoachHintLevel(userId, problem.dbId),
      listSubmissions({ userId, problemId: problem.dbId }),
      loadSolution(problem.id),
      loadWorkspace(session),
    ]);

    const solved = submissions.some((submission) => submission.status === 'accepted');
    const givesHint = Boolean(ACTIONS[action]?.nextHint);
    const hintLevel = givesHint ? Math.min(currentLevel + 1, MAX_HINT_LEVEL) : Math.max(currentLevel, 1);

    const showCode = solved || hintLevel >= CODE_VISIBLE_FROM_LEVEL;
    const { files, omitted } = showCode ? chooseFiles(source, activeFile) : { files: [], omitted: [] };
    const reply = await generateSafeReply({
      systemInstruction: buildSystemInstruction({ problem, hintLevel, solved }),
      history: messages.map((row) => ({
        role: row.role === 'coach' ? 'model' : 'user',
        parts: [{ text: row.content }],
      })),
      workspace: buildWorkspaceBlock({
        nonce: `data_${randomBytes(6).toString('hex')}`,
        readme: readme.content,
        files,
        omitted,
        activeFile,
        submission: submissions[0],
        logs,
      }),
      question,
      solved,
      solution,
    });

    const saved = await insertCoachExchange({
      userId,
      problemId: problem.dbId,
      question,
      reply,
      hintLevel: givesHint ? hintLevel : null,
    });

    return {
      messages: saved.map(toPublicMessage),
      hintLevel: givesHint ? hintLevel : currentLevel,
      remainingToday: await remainingToday(userId),
    };
  } finally {
    inFlight.delete(userId);
  }
}
