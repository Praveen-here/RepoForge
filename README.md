# RepoForge

A LeetCode-style platform for **repo-level** challenges. Users open a real codebase in the browser, find the bug, fix it, watch the live preview, and submit for grading against hidden tests.

**Current state: Phase 2.** Users sign in with Google, GitHub or an email magic link. They browse a problem list, work in a private container per problem, and their submissions and progress are saved in PostgreSQL.

## How it works

```
Browser (Next.js)                         Backend (Express)                      Docker / Postgres
─────────────────                         ─────────────────                      ─────────────────
Login (Google/GitHub/email)  ── REST ──►  authController  ── OAuth / Brevo ──►  users, auth_accounts, magic_links
Problem list                 ── REST ──►  problemService  ─────────────────►    problems, submissions
File explorer + editor       ── REST ──►  fileService     ── exec / archive ──►  user's container
Terminal (xterm.js)          ── WS ────►  terminalService ── docker exec sh ──►  user's container
App logs                     ── WS ────►  logService      ── docker logs -f ──►  user's container
Preview (iframe)             ── HTTP ──────────────────────────────────────────►  container port
Submit                       ── REST ──►  gradingService  ── fresh container + hidden tests → submissions
```

- **Sign-in:** a signed JWT in an httpOnly cookie (`rf_session`, 7 days). Google, GitHub and email logins that share an email address map to one user.
- **Magic links:** 1-hour, single-use tokens. Only a SHA-256 hash is stored. Limited to 3 per email every 15 minutes.
- **One container per user per problem.** Editable folders are Docker volumes (`rf_<userId>_<problem>_<folder>`), so work survives restarts. Users can only reach their own sessions.
- **Grading** runs in a separate, network-less container with the user's files and the hidden tests. The result is saved to `submissions`.

## Folder structure

```
repo-forge/
├── backend/                      Express API (Node 22, ES modules)
│   └── src/
│       ├── server.js             entry point: checks config + DB, starts HTTP + WebSockets
│       ├── app.js                Express app (CORS with cookies, routes, errors)
│       ├── config/               all settings, read from .env
│       ├── db/                   pool, migrate.js, seed.js, migrations/*.sql, seeds/
│       ├── repositories/         SQL only (users, magic links, problems, submissions)
│       ├── services/             the real work: auth, oauth/, mail/, magic links, problems,
│       │                         sessions, files, grading, submissions, terminal, logs, docker
│       ├── controllers/          request/response handling (thin)
│       ├── routes/               URL → controller mapping
│       ├── middleware/           requireAuth, error handling
│       ├── ws/                   WebSocket routing + cookie check (/ws/terminal, /ws/logs)
│       └── utils/                errors, paths, tar, tokens, redirects, cookies
└── frontend/                     Next.js 16 app (App Router, CSS modules)
    └── src/
        ├── app/                  /login, /auth/magic, /problems, /problems/[problemId]
        ├── components/
        │   ├── auth/             AuthProvider, RequireAuth, LoginForm, MagicLinkVerifier, UserMenu
        │   ├── problems/         problem list
        │   ├── workspace/        the problem workspace layout
        │   ├── description/      problem statement (rendered README)
        │   ├── submissions/      submission history
        │   ├── editor/ explorer/ terminal/ panel/ results/ preview/ layout/ ui/
        ├── hooks/                session, file tree, open files, resizable panes, persistent state
        └── lib/                  API client, markdown, file helpers
```

## Running locally

**Prerequisites:** Docker Desktop running, Node 22+, PostgreSQL with the `capstone_db` database, the problem image built, and the hidden tests cloned next to this folder:

```
Capstone_Project/
├── repo-forge/              (this repo)
├── repo-forge-tests/        (private hidden tests)
└── repo-forge-challenges/express-authentication-001/
```

```bash
# 1. Build the problem image (once, or after changing the problem)
cd ../repo-forge-challenges/express-authentication-001
docker build -t express-authentication-001:v1 .

# 2. Backend settings: copy the example, then fill in the values (see "Sign-in setup")
cd repo-forge/backend
cp .env.example .env
npm install
npm run db:setup          # create tables + load problems (safe to run again)
npm run dev               # http://localhost:4000

# 3. Frontend, in a second terminal
cd repo-forge/frontend
cp .env.example .env.local
npm install
npm run dev               # http://localhost:3000
```

### Testing emails locally (optional)

Set `MAIL_PROVIDER=mailpit` in `backend/.env` and start Mailpit, a local inbox that catches every email:

```bash
docker run -d --name mailpit --restart unless-stopped -p 127.0.0.1:8025:8025 axllent/mailpit
```

Emails appear at http://localhost:8025. Use `MAIL_PROVIDER=brevo` for real delivery, or `console` to print links in the backend terminal.

## Sign-in setup

| Provider | Where | Redirect / callback URL |
|---|---|---|
| Google | Google Cloud Console → Google Auth Platform → Clients (Web application) | `http://localhost:4000/api/auth/google/callback` |
| GitHub | GitHub → Settings → Developer settings → OAuth Apps | `http://localhost:4000/api/auth/github/callback` |
| Email | Brevo → verified sender + API key | – |

While the Google app is in **Testing** mode, only the test users listed in the Google console can sign in with Google.

## API

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/auth/providers` | – | Which sign-in methods are configured |
| GET | `/api/auth/me` | – | The signed-in user, or `{ user: null }` |
| GET | `/api/auth/:provider` | – | Start Google/GitHub sign-in (`?next=/path`) |
| GET | `/api/auth/:provider/callback` | – | OAuth return address |
| POST | `/api/auth/magic-link` | – | Email a sign-in link `{ email, next }` |
| POST | `/api/auth/magic-link/verify` | – | Sign in with `{ token }` |
| POST | `/api/auth/logout` | – | Clear the login cookie |
| GET | `/api/problems` | ✓ | Problem list with the user's status (solved / attempted / todo) |
| GET | `/api/problems/:problemId` | ✓ | Problem details |
| GET | `/api/problems/:problemId/submissions` | ✓ | The user's submission history |
| POST | `/api/sessions` | ✓ | Start (or reuse) the user's container for `{ problemId }` |
| POST | `/api/sessions/:id/restart` | ✓ | Restart the container |
| DELETE | `/api/sessions/:id?reset=true` | ✓ | Delete the container (`reset` also deletes saved work) |
| GET | `/api/sessions/:id/files` | ✓ | File tree |
| GET / PUT | `/api/sessions/:id/files/content` | ✓ | Read / save a file (editable folders only) |
| POST | `/api/sessions/:id/submissions` | ✓ | Grade against the hidden tests and save the result |
| WS | `/ws/terminal?sessionId=` | ✓ cookie | Interactive shell |
| WS | `/ws/logs?sessionId=` | ✓ cookie | Live app output |

## Still to come

- **Phase 3:** idle-container cleanup, a "Reset problem" button, sessions stored in Postgres, per-user container limits.
- **Content:** a `publish-problem` script and more Express, Django and Spring problems.
- **Deployment:** HTTPS, a per-session preview proxy, and hidden tests pulled from GitHub on the server.
