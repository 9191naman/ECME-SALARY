# ACME Pay Ledger

Salary management for a 10,000-person, multi-country org. Node + TypeScript + Express + SQLite, React + Vite.
Docs: [Requirements](docs/REQUIREMENTS.md) · [Architecture and trade-offs](docs/ARCHITECTURE.md) · [AI workflow](docs/AI_WORKFLOW.md)

## Run locally
```bash
cd server && npm install && npm test && npm run seed   # seeds 10,000 employees into salary.db
npm run dev                                            # API on :3001
cd ../web && npm install && npm run dev                # UI on :5173 (proxies /api)
```
Production-style: `cd web && npm run build`, then `cd ../server && npm run build && npm start` (serves UI + API on one port, auto-seeds an empty DB).

## Deploy (Render / Fly.io / Railway)
Use the root `Dockerfile`. Mount a persistent disk at `/data`. Set nothing else; the app seeds itself on first boot. Health check: `/api/health`.

## Suggested incremental commits
1. `docs: requirements one-pager`
2. `docs: architecture and trade-offs`
3. `test: stats summarize/group (red)` then `feat: stats`
4. `feat: schema, repo, validation`
5. `test+feat: employee CRUD API`
6. `test+feat: listing pagination/filter/sort`
7. `test+feat: insights endpoint`
8. `feat: deterministic seed script (10k)`
9. `feat(web): employee table, filters, form`
10. `feat(web): insights view`
11. `chore: Dockerfile, deploy, README`
12. `docs: AI workflow notes`

## Demo video script (about 3 min)
1. Problem framing (15s). 2. Employees: search, filter India, sort by salary, edit one (60s). 3. Add with invalid data, show the error, then save (30s). 4. "How we pay": org view, drill into a country, point out currency handling (45s). 5. Show `npm test` passing and the layering in the repo (30s).
