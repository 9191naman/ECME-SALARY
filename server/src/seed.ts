import { fileURLToPath } from 'node:url';
import { openDb, type DB } from './db.js';
import { EmployeeRepo } from './repo/employeeRepo.js';
import { COUNTRY_CODES, type CountryCode } from './domain/countries.js';
import type { EmployeeInput } from './domain/validation.js';

const FIRST = [
  'Aarav',
  'Priya',
  'Rohan',
  'Ananya',
  'Liam',
  'Emma',
  'Noah',
  'Olivia',
  'Hans',
  'Greta',
  'Wei',
  'Mei',
  'Oliver',
  'Amelia',
  'Karan',
  'Sneha',
  'Lucas',
  'Sofia',
  'Arjun',
  'Isha',
];
const LAST = [
  'Sharma',
  'Patel',
  'Iyer',
  'Nair',
  'Smith',
  'Johnson',
  'Brown',
  'Mueller',
  'Schmidt',
  'Tan',
  'Lim',
  'Taylor',
  'Wilson',
  'Gupta',
  'Reddy',
  'Khan',
  'Davis',
  'Clark',
  'Weber',
  'Ng',
];
const ROLES: Record<string, { title: string; usd: number }[]> = {
  Engineering: [
    { title: 'Software Engineer', usd: 70000 },
    { title: 'Senior Software Engineer', usd: 105000 },
    { title: 'Staff Engineer', usd: 150000 },
    { title: 'Engineering Manager', usd: 140000 },
  ],
  Sales: [
    { title: 'Account Executive', usd: 60000 },
    { title: 'Sales Manager', usd: 95000 },
  ],
  Marketing: [
    { title: 'Marketing Associate', usd: 50000 },
    { title: 'Marketing Lead', usd: 85000 },
  ],
  HR: [
    { title: 'HR Generalist', usd: 48000 },
    { title: 'HR Business Partner', usd: 78000 },
  ],
  Finance: [
    { title: 'Financial Analyst', usd: 62000 },
    { title: 'Finance Controller', usd: 110000 },
  ],
  Product: [
    { title: 'Product Manager', usd: 100000 },
    { title: 'Design Lead', usd: 95000 },
  ],
};
// Pay level vs the USD baseline, and local currency units per USD (mirrors countries.ts)
const COUNTRY: Record<CountryCode, { level: number; perUsd: number }> = {
  IN: { level: 0.35, perUsd: 1 / 0.012 },
  US: { level: 1.15, perUsd: 1 },
  GB: { level: 0.9, perUsd: 1 / 1.27 },
  DE: { level: 0.9, perUsd: 1 / 1.08 },
  SG: { level: 0.95, perUsd: 1 / 0.74 },
};

/** Deterministic PRNG so seeds (and tests) are reproducible. */
export function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateEmployees(n: number, seed = 42): EmployeeInput[] {
  const rnd = mulberry32(seed);
  const pick = <T>(a: readonly T[]) => a[Math.floor(rnd() * a.length)];
  const depts = Object.keys(ROLES);
  return Array.from({ length: n }, (_, i) => {
    const country = pick(COUNTRY_CODES),
      department = pick(depts),
      role = pick(ROLES[department]);
    const c = COUNTRY[country];
    const salary = Math.round((role.usd * c.level * c.perUsd * (0.85 + rnd() * 0.3)) / 100) * 100;
    const first = pick(FIRST),
      last = pick(LAST);
    const d = new Date(
      Date.UTC(2015 + Math.floor(rnd() * 11), Math.floor(rnd() * 12), 1 + Math.floor(rnd() * 28)),
    );
    return {
      fullName: `${first} ${last}`,
      email: `${first}.${last}.${i}@acme.example`.toLowerCase(),
      country,
      department,
      jobTitle: role.title,
      salary,
      hireDate: d.toISOString().slice(0, 10),
    };
  });
}

export function seedIfEmpty(db: DB, n = 10_000) {
  const { c } = db.prepare('SELECT COUNT(*) c FROM employees').get() as { c: number };
  if (c > 0) return false;
  new EmployeeRepo(db).bulkInsert(generateEmployees(n));
  return true;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const t = Date.now();
  const db = openDb(process.env.DB_FILE ?? 'salary.db');
  console.log(
    seedIfEmpty(db)
      ? `Seeded 10,000 employees in ${Date.now() - t}ms`
      : 'DB already has data; skipped',
  );
}
