# RepoForge

A LeetCode-style platform for **repo-level** challenges: users open a real codebase in the browser, find the bug, fix it, watch the live preview, and submit for grading against hidden tests.

This is the **Phase 0 spike**: one problem, no login, no database. It proves the hard parts work end to end: containers, file editing, terminal, preview and grading.

## How it works

```
Browser (Next.js)                         Backend (Express)                      Docker
─────────────────                         ─────────────────                      ──────
File explorer + editor  ── REST ───────►  fileService     ── exec / archive ──►  user's container
Terminal (xterm.js)     ── WebSocket ──►  terminalService ── docker exec sh ──►  user's container
App logs                ── WebSocket ──►  logService      ── docker logs -f ──►  user's container
Preview (iframe)        ── HTTP ─────────────────────────────────────────────►  container port
Submit                  ── REST ───────►  gradingService  ── fresh container + hidden tests
```

- **One container per user session**, started from the problem image.
- **Editable folders are Docker volumes** (`rf_<user>_<problem>_<folder>`), so work survives container restarts.
- **Grading** runs in a separate, network-less container with the user's files and the hidden tests, then it is deleted.

## Folder structure

```
repo-forge/
├── backend/                      Express API (Node 22, ES modules)
│   └── src/
│       ├── server.js             HTTP + WebSocket server entry point
│       ├── app.js                Express app (middleware + routes)
│       ├── config/               settings (index.js) and the problem registry (problems.js)
│       ├── routes/               URL → controller mapping
│       ├── controllers/          request/response handling (thin)
│       ├── services/             the real work: Docker, sessions, files, grading, terminal, logs
│       ├── ws/                   WebSocket routing (/ws/terminal, /ws/logs)
│       ├── middleware/           error handling
│       └── utils/                small helpers (errors, paths, tar archives)
└── frontend/                     Next.js 16 app (App Router, plain CSS modules)
    └── src/
        ├── app/                  pages: / redirects to /problems/[problemId]
        ├── components/
        │   ├── workspace/        page layout that wires everything together
        │   ├── layout/           top bar, status bar
        │   ├── explorer/         file tree
        │   ├── editor/           Monaco editor, tabs, theme
        │   ├── terminal/         xterm.js terminal (shell and logs)
        │   ├── panel/            bottom panel (Terminal / App Logs / Test Results)
        │   ├── results/          grading results
        │   ├── preview/          mini browser
        │   └── ui/               buttons, icons, spinner, resizer
        ├── hooks/                session, file tree, open files, resizable panes
        └── lib/                  API client, file helpers
```

## Running locally

Prerequisites: Docker Desktop running, Node 22+, the problem image built, and the hidden tests cloned next to this folder:

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

# 2. Backend (http://localhost:4000)
cd repo-forge/backend
cp .env.example .env
npm install
npm run dev

# 3. Frontend (http://localhost:3000), in a second terminal
cd repo-forge/frontend
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000.

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/problems/:problemId` | Problem details |
| POST | `/api/sessions` | Start (or reuse) a container for `{ problemId }` |
| POST | `/api/sessions/:id/restart` | Restart the container |
| DELETE | `/api/sessions/:id?reset=true` | Delete the container (`reset` also deletes saved work) |
| GET | `/api/sessions/:id/files` | File tree |
| GET | `/api/sessions/:id/files/content?path=` | Read a file |
| PUT | `/api/sessions/:id/files/content` | Save a file `{ path, content }` (editable folders only) |
| POST | `/api/sessions/:id/submissions` | Grade against the hidden tests |
| WS | `/ws/terminal?sessionId=` | Interactive shell |
| WS | `/ws/logs?sessionId=` | Live app output |

## Spike limitations (planned for later phases)

- No login: every session belongs to a single `demo` user.
- Problems are hardcoded in `backend/src/config/problems.js` (moves to Postgres in Phase 2).
- Sessions are kept in memory. The backend re-adopts running containers on restart, but there are no idle timeouts yet (Phase 3).
- The preview uses a direct `localhost:<port>` URL; a subdomain proxy comes with the cloud setup.
- Monaco loads from the jsDelivr CDN, so the editor needs an internet connection.
