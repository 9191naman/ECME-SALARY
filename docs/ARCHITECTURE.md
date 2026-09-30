# Technical design

## 1. Shape
```
React SPA (Vite)  --HTTP/JSON-->  Express API (TypeScript)  -->  SQLite (better-sqlite3)
                                   |- validation (zod)          employees table + 3 indexes
                                   |- EmployeeRepo (SQL only)
                                   |- insights / stats (pure functions)
```
One deployable: Express serves the built SPA and `/api`. One Docker image, one volume for the DB file.

## 2. Layers and why
- **domain/**: zod schemas, country/currency table, statistics. Pure, no I/O, unit-tested without a DB.
- **repo/**: the only place with SQL. Parameterised queries; sort columns come from a whitelist enum (no injection surface).
- **app.ts**: HTTP wiring and one central error handler mapping ZodError to 400, unique violation to 409, unknown to 500.
- `createApp(db)` takes the DB as an argument, so tests use `:memory:` SQLite: fast, isolated, deterministic.

## 3. Data model
`employees(id, full_name, email UNIQUE, country, department, job_title, salary INTEGER CHECK>0, hire_date, created_at, updated_at)`.
- Salary is an **integer** in whole local units: no floating point money errors.
- Indexes: `country`, `department`, `full_name` (filter/sort paths).
- Departments and titles are free text in v1 (T5).

## 4. API
| Method | Path | Notes |
|---|---|---|
| GET | /api/employees | `page,pageSize(<=100),q,country,department,sort,dir`; returns `{items,total,...}` |
| GET/PUT/DELETE | /api/employees/:id | 404 if missing |
| POST | /api/employees | 201, 400 with field errors, 409 duplicate email |
| GET | /api/insights?country= | stats by country / department / title |
| GET | /api/meta | countries, currencies, departments for dropdowns |

## 5. Trade-offs
| ID | Decision | Alternative | Why |
|----|----------|-------------|-----|
| T1 | SQLite | Postgres | 10k rows, single writer, zero-ops, ships in the image. Repo boundary makes a Postgres swap a contained change. Cost: no horizontal scaling of writes. |
| T2 | Insights computed in JS over 10k rows | SQL aggregates / materialised views | Median and percentiles are awkward in SQLite; 10k numbers sort in about a millisecond. Revisit at 500k+ rows (Postgres `percentile_cont`). |
| T3 | Static FX table | Live rates API | Deterministic, testable, no dependency. Org-wide numbers marked "approximate"; per-country numbers are exact and never mix currencies. |
| T4 | Offset pagination | Keyset | Simple, supports "page N of M" and arbitrary sort. Fine at 10k; keyset if the table grows 100x. |
| T5 | Free-text department/title | Lookup tables | Fewer moving parts for v1; cost is possible typos ("Engg"). First refactor if HR wants governance. |
| T6 | No component library, small custom CSS | MUI / Mantine | Bundle stays tiny, accessible native controls, no theming fight. Cost: more hand-written CSS. |
| T7 | Monolith serving SPA | Split deploy | One URL, no CORS, simple deploy. |
| T8 | No auth | Add SSO | Out of scope for the persona; documented as first hardening step. |

## 6. Performance
- List query: indexed filter + `LIMIT/OFFSET`, page size capped at 100. `LIKE '%q%'` cannot use an index; acceptable at 10k (full scan is sub-10 ms). Beyond that use FTS5.
- Seed: one transaction with a prepared statement inserts 10k rows in well under a second.
- Insights: one query selecting 4 columns, then in-memory grouping. Could be cached per write-version if needed.
- UI: debounced search (300 ms), stale-response guard on fetches, only 25 rows rendered.

## 7. Testing strategy
- Unit: stats (empty, odd/even, percentile, immutability), seed determinism/uniqueness.
- API integration (supertest + in-memory DB): CRUD lifecycle, validation, 409, pagination, filter, sort whitelist, insights currency handling.
- All tests run in about a second, with no network and a seeded PRNG.

## 8. Future
Auth + roles; `salary_changes` table (employee_id, old, new, effective_date, actor) for history; CSV import/export; pay bands and outlier flags; Postgres; cursor pagination; observability.
