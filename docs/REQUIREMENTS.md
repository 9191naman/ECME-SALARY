# Requirements: ACME Pay Ledger (one page)

## Goal
Replace the Excel files HR uses for ~10,000 employees in several countries with a web app where the HR Manager can **maintain salary records** and **answer "how do we pay people?"** in seconds.

## Persona
HR Manager. Non-technical, works on a laptop, needs speed and trust in the numbers. Single trusted user for v1.

## Scope (built)
| # | Feature | Why |
|---|---------|-----|
| 1 | Employee list: server-side pagination, search (name/email/title), filter (country, department), sort | 10k rows; Excel's core job is find and scan |
| 2 | Add / edit / delete employee with field-level validation and duplicate-email protection | Replaces manual sheet edits, prevents bad data |
| 3 | Salaries shown in each employee's local currency | Multi-country org; wrong currency means wrong decisions |
| 4 | "How we pay" insights: headcount, payroll, min / median / average / p90 / max by country, department, job title; country drill-down | The stated question the tool must answer |
| 5 | Seed script: 10,000 deterministic, realistic employees | Required; reproducible demos and tests |

## Deliberately left out (and why)
| Not built | Reasoning |
|-----------|-----------|
| Authentication / roles | One persona; auth is a deployment concern (put behind SSO/reverse proxy). Would be the first v2 item before real data. |
| Salary history / audit log | High value, but it changes the data model. The schema is ready for it (see ARCHITECTURE, Future). |
| Live FX rates | Adds an external dependency. Static rates are labelled "approximate" in the UI; per-country numbers stay exact in local currency. |
| Bonus, equity, allowances, payroll runs | Different problem (payroll). We answer "how do we pay", not "run payroll". |
| Excel import/export | Tempting, but migration is a one-off. The seed and bulk-insert path is the hook for it. |
| Gender / pay-equity analysis | Needs demographic data we do not model; sensitive, needs a policy decision first. |

## Success criteria
- Any list interaction returns in under 200 ms on 10k rows.
- HR can find a person and change a salary in under 30 seconds.
- Insights for the whole org load in under 500 ms.
- Invalid data (negative salary, bad email, unknown country) is rejected with a clear message.

## Assumptions
Salary is annual gross, whole units of local currency. One country maps to one currency. Five countries in v1 (IN, US, GB, DE, SG).
