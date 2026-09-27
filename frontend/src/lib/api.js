const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const WS_URL = API_URL.replace(/^http/, 'ws');

async function request(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${API_URL}/api${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = res.status === 204 ? {} : await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.message || `Request failed (${res.status})`);
    error.status = res.status;
    throw error;
  }
  return data;
}

export const api = {
  getProblem: (problemId) => request(`/problems/${problemId}`),

  startSession: (problemId) => request('/sessions', { method: 'POST', body: { problemId } }),
  restartSession: (sessionId) => request(`/sessions/${sessionId}/restart`, { method: 'POST' }),

  listFiles: (sessionId) => request(`/sessions/${sessionId}/files`),
  readFile: (sessionId, path) =>
    request(`/sessions/${sessionId}/files/content?path=${encodeURIComponent(path)}`),
  writeFile: (sessionId, path, content) =>
    request(`/sessions/${sessionId}/files/content`, { method: 'PUT', body: { path, content } }),

  submit: (sessionId) => request(`/sessions/${sessionId}/submissions`, { method: 'POST' }),
};

/** kind: "terminal" | "logs" */
export function socketUrl(kind, sessionId) {
  return `${WS_URL}/ws/${kind}?sessionId=${encodeURIComponent(sessionId)}`;
}
