import { config } from '../../config/index.js';
import { HttpError } from '../../utils/HttpError.js';

// Talks to the Google Gemini API. The key is sent in a header (never in a URL, so it
// cannot end up in logs) and is only ever used on the server.

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const RETRY_WITH_NEXT_MODEL = new Set([408, 429, 500, 502, 503, 504]);
const RATE_LIMIT_COOLDOWN_MS = 60_000;
const RETRY_DELAY_MS = 1500;
const MAX_TOTAL_WAIT_MS = 40_000;

// Models that just hit their usage limit are skipped for a while, so users don't wait on them.
const coolingUntil = new Map();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function modelsToTry() {
  const ready = config.coach.models.filter((model) => (coolingUntil.get(model) || 0) <= Date.now());
  return ready.length ? ready : config.coach.models;
}

async function callModel(model, body) {
  const response = await fetch(`${BASE_URL}/${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': config.coach.apiKey },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(config.coach.requestTimeoutMs),
  });

  if (!response.ok) {
    const error = new Error(`Gemini ${model} answered ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

/**
 * Asks Gemini for a JSON reply matching `schema`. Returns the parsed object, or null
 * when the model produced nothing usable (blocked by its safety filters, cut off, etc.).
 * When a model is overloaded the next one in the list is tried, and if they are all
 * busy the list is tried once more after a short pause.
 */
export async function generateJson({ systemInstruction, contents, schema }) {
  const body = {
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents,
    generationConfig: {
      maxOutputTokens: config.coach.maxOutputTokens,
      thinkingConfig: { thinkingLevel: 'low' },
      responseMimeType: 'application/json',
      responseJsonSchema: schema,
    },
  };

  const startedAt = Date.now();
  let lastError;
  for (let round = 0; round < 2; round += 1) {
    if (round > 0) await sleep(RETRY_DELAY_MS);

    for (const model of modelsToTry()) {
      if (Date.now() - startedAt > MAX_TOTAL_WAIT_MS) break;

      let data;
      try {
        data = await callModel(model, body);
      } catch (error) {
        lastError = error;
        const retryable = error.name === 'TimeoutError' || RETRY_WITH_NEXT_MODEL.has(error.status);
        if (!retryable) {
          console.error('Coach: Gemini request failed:', error.message);
          throw new HttpError(503, 'The coach is unavailable right now. Please try again in a moment.');
        }
        if (error.status === 429) coolingUntil.set(model, Date.now() + RATE_LIMIT_COOLDOWN_MS);
        console.warn(`Coach: ${model}: ${error.status || 'timed out'}, trying the next model`);
        continue;
      }

      const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('');
      if (!text) return null;
      try {
        return JSON.parse(text);
      } catch {
        return null;
      }
    }
  }

  console.error('Coach: Gemini request failed:', lastError?.message);
  if (lastError?.status === 429) {
    throw new HttpError(429, 'The coach has reached its usage limit for now. Please try again in a little while.');
  }
  throw new HttpError(503, 'The coach is unavailable right now. Please try again in a moment.');
}
