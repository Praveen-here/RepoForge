const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const WS_URL = API_URL.replace(/^http/, 'ws');

async function request(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${API_URL}/api${path}`, {
    method,
    credentials: 'include', // send the httpOnly login cookie
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
  // Auth
  getMe: () => request('/auth/me'),
  getProviders: () => request('/auth/providers'),
  requestMagicLink: (email, next) => request('/auth/magic-link', { method: 'POST', body: { email, next } }),
  verifyMagicLink: (token) => request('/auth/magic-link/verify', { method: 'POST', body: { token } }),
  logout: () => request('/auth/logout', { method: 'POST' }),

  // Problems
  listProblems: () => request('/problems'),
  getProblem: (problemId) => request(`/problems/${problemId}`),
  listSubmissions: (problemId) => request(`/problems/${problemId}/submissions`),

  // Workspace sessions
  startSession: (problemId) => request('/sessions', { method: 'POST', body: { problemId } }),
  restartSession: (sessionId) => request(`/sessions/${sessionId}/restart`, { method: 'POST' }),

  listFiles: (sessionId) => request(`/sessions/${sessionId}/files`),
  readFile: (sessionId, path) =>
    request(`/sessions/${sessionId}/files/content?path=${encodeURIComponent(path)}`),
  writeFile: (sessionId, path, content) =>
    request(`/sessions/${sessionId}/files/content`, { method: 'PUT', body: { path, content } }),

  submit: (sessionId) => request(`/sessions/${sessionId}/submissions`, { method: 'POST' }),
};

/** Full-page redirect target that starts "Sign in with Google/GitHub". */
export function oauthStartUrl(provider, next = '/problems') {
  return `${API_URL}/api/auth/${provider}?next=${encodeURIComponent(next)}`;
}

/** kind: "terminal" | "logs" */
export function socketUrl(kind, sessionId) {
  return `${WS_URL}/ws/${kind}?sessionId=${encodeURIComponent(sessionId)}`;
}
