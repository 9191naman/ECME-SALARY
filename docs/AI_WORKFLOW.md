# How AI was used (edit to match your real sessions before submitting)

**Principle:** AI drafts, I decide and verify. Every generated unit was read, run, and often reshaped.

| Step | Prompt (abridged) | What I kept / changed |
|------|-------------------|------------------------|
| Requirements | "Act as a product engineer. HR manager, 10k employees, multi-country. Draft a one-page requirements doc: goal, scope, and explicit non-goals with reasoning." | Cut scope hard; added success criteria and the currency assumption. |
| Design | "Propose architecture for a small Node/TS + React + SQLite app. List trade-offs, not just a pick." | Kept SQLite and monolith; wrote the T1-T8 table myself. |
| TDD | "Write failing tests first for summarize() and the /api/employees contract." | Added the SQL injection sort test and the multi-currency insight test. |
| Implementation | "Implement to make these tests pass. Repo has SQL only; domain stays pure." | Enforced the layering by rejecting SQL in route handlers. |
| Seed | "Deterministic generator with a seeded PRNG, salaries realistic per country in local currency." | Added a country pay-level factor so INR and USD figures are believable. |
| UI | "Accessible table with sortable headers, debounced search, form with field errors." | Added stale-response guard and aria-sort. |
| Review | "Review this diff for bugs, security, and missing tests." | Caught duplicate email handling; added the 409 path. |

**Where AI was wrong / needed correction:** (write 2-3 real examples from your run, e.g. suggested averaging salaries across currencies; suggested `localStorage` auth for a demo).
