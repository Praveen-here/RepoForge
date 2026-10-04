import {
  countAttempting,
  getScore,
  getSolvedByDifficulty,
  getSolvedByFramework,
  getSubmissionDays,
  listSolved,
} from '../repositories/profileRepository.js';
import { findUserByUsername, updateProfile, usernameTaken } from '../repositories/userRepository.js';
import { HttpError } from '../utils/HttpError.js';
import { toPublicUser, USERNAME_PATTERN } from './authService.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

const dayNumber = (isoDay) => Math.round(Date.parse(`${isoDay}T00:00:00Z`) / DAY_MS);

/** Longest run of consecutive active days, and the run that ends today (or yesterday). */
function streaks(days) {
  const numbers = days.map((d) => dayNumber(d.day));
  let max = 0;
  let run = 0;
  numbers.forEach((n, i) => {
    run = i > 0 && n === numbers[i - 1] + 1 ? run + 1 : 1;
    max = Math.max(max, run);
  });

  const today = Math.floor(Date.now() / DAY_MS);
  const last = numbers[numbers.length - 1];
  const current = last === today || last === today - 1 ? run : 0;
  return { max, current };
}

function buildBadges({ solved, frameworks, maxStreak }) {
  const firstTries = solved.filter((s) => s.first_try);
  const solvedFrameworks = frameworks.filter((f) => f.solved > 0).length;
  const hard = solved.find((s) => s.difficulty === 'Hard');

  return [
    {
      id: 'first-fix',
      name: 'First Fix',
      description: 'Solve your first problem',
      earnedAt: solved[0]?.solved_at || null,
    },
    {
      id: 'hard-hitter',
      name: 'Hard Hitter',
      description: 'Solve a Hard problem',
      earnedAt: hard?.solved_at || null,
    },
    {
      id: 'sharpshooter',
      name: 'Sharpshooter',
      description: 'Solve 3 problems on the first try',
      earnedAt: firstTries[2]?.solved_at || null,
    },
    {
      id: 'polyglot',
      name: 'Polyglot',
      description: 'Solve a problem in every framework',
      earnedAt: frameworks.length > 1 && solvedFrameworks === frameworks.length ? solved[solved.length - 1].solved_at : null,
    },
    {
      id: 'streak-7',
      name: '7-Day Streak',
      description: 'Submit on 7 days in a row',
      earnedAt: maxStreak >= 7 ? 'earned' : null,
    },
  ].map((badge) => ({ ...badge, earned: Boolean(badge.earnedAt) }));
}

export async function getProfile(username, viewerId) {
  const user = await findUserByUsername(String(username || '').toLowerCase());
  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  const [score, byDifficulty, attempting, frameworks, solved, days] = await Promise.all([
    getScore(user.id),
    getSolvedByDifficulty(user.id),
    countAttempting(user.id),
    getSolvedByFramework(user.id),
    listSolved(user.id),
    getSubmissionDays(user.id),
  ]);

  const { max: maxStreak, current: currentStreak } = streaks(days);
  const yearStart = Math.floor(Date.now() / DAY_MS) - 364;
  const lastYear = days.filter((d) => dayNumber(d.day) >= yearStart);

  let running = 0;
  const scoreHistory = solved.map((s) => {
    running += Math.round(s.points * (s.first_try ? 1.2 : 1));
    return { date: s.solved_at, score: running };
  });

  const difficulty = Object.fromEntries(
    DIFFICULTIES.map((name) => {
      const row = byDifficulty.find((r) => r.difficulty === name);
      return [name, { solved: row?.solved || 0, total: row?.total || 0 }];
    }),
  );

  return {
    user: { ...toPublicUser(user), memberSince: user.created_at, isMe: String(user.id) === String(viewerId) },
    stats: {
      score: score.score,
      rank: Number(score.rank),
      totalUsers: score.total_users,
      solved: score.solved,
      totalProblems: DIFFICULTIES.reduce((sum, name) => sum + difficulty[name].total, 0),
      attempting,
      difficulty,
    },
    frameworks: frameworks.map((f) => ({ framework: f.framework, solved: f.solved, total: f.total })),
    badges: buildBadges({ solved, frameworks, maxStreak }),
    calendar: {
      days: lastYear,
      totalSubmissions: lastYear.reduce((sum, d) => sum + d.count, 0),
      activeDays: lastYear.length,
      maxStreak,
      currentStreak,
    },
    scoreHistory,
    recentAccepted: [...solved]
      .reverse()
      .slice(0, 10)
      .map((s) => ({ id: s.slug, number: s.number, title: s.title, difficulty: s.difficulty, solvedAt: s.solved_at })),
  };
}

export async function updateMyProfile(user, { name, username }) {
  const cleanName = String(name ?? user.name).trim();
  const cleanUsername = String(username ?? user.username).trim().toLowerCase();

  if (!cleanName || cleanName.length > 50) {
    throw new HttpError(400, 'Name must be between 1 and 50 characters');
  }
  if (!USERNAME_PATTERN.test(cleanUsername)) {
    throw new HttpError(400, 'Username must be 3-20 characters: lowercase letters, numbers, "-" or "_"');
  }
  if (cleanUsername !== user.username && (await usernameTaken(cleanUsername))) {
    throw new HttpError(409, 'That username is already taken');
  }

  return toPublicUser(await updateProfile(user.id, { name: cleanName, username: cleanUsername }));
}
