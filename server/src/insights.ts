import { COUNTRIES, toUsd, type CountryCode } from './domain/countries.js';
import { groupSummaries, summarize } from './domain/stats.js';
import type { EmployeeRepo } from './repo/employeeRepo.js';

/** Country given -> local currency. Otherwise USD-normalised (approximate, static FX). */
export function buildInsights(repo: EmployeeRepo, country?: CountryCode) {
  const all = repo.salaryRows();
  const rows = country ? all.filter((r) => r.country === country) : all;
  const val = (r: (typeof all)[number]) => (country ? r.salary : toUsd(r.salary, r.country));
  return {
    currency: country ? COUNTRIES[country].currency : 'USD',
    scope: country ?? 'ALL',
    overall: summarize(rows.map(val)),
    payroll: rows.reduce((a, r) => a + val(r), 0),
    // per-country stats are always in local currency: never average across currencies
    byCountry: groupSummaries(
      all,
      (r) => r.country,
      (r) => r.salary,
    ).map((g) => ({ ...g, currency: COUNTRIES[g.group as CountryCode].currency })),
    byDepartment: groupSummaries(rows, (r) => r.department, val),
    byJobTitle: groupSummaries(rows, (r) => r.jobTitle, val).slice(0, 15),
  };
}
