import type { DB } from '../db.js';
import type { EmployeeInput, ListQuery } from '../domain/validation.js';
import type { CountryCode } from '../domain/countries.js';

const COLS = `id, full_name AS fullName, email, country, department, job_title AS jobTitle, salary, hire_date AS hireDate`;
const SORT_COL = {
  fullName: 'full_name',
  salary: 'salary',
  hireDate: 'hire_date',
  country: 'country',
  department: 'department',
} as const;
const INSERT = `INSERT INTO employees (full_name,email,country,department,job_title,salary,hire_date) VALUES (@fullName,@email,@country,@department,@jobTitle,@salary,@hireDate)`;

export class EmployeeRepo {
  constructor(private db: DB) {}

  list(q: ListQuery) {
    const where: string[] = [];
    const p: Record<string, unknown> = {};
    if (q.q) {
      where.push('(full_name LIKE @q OR email LIKE @q OR job_title LIKE @q)');
      p.q = `%${q.q}%`;
    }
    if (q.country) {
      where.push('country = @country');
      p.country = q.country;
    }
    if (q.department) {
      where.push('department = @department');
      p.department = q.department;
    }
    const w = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const total = (this.db.prepare(`SELECT COUNT(*) c FROM employees ${w}`).get(p) as { c: number })
      .c;
    // sort/dir come from a zod enum whitelist, so interpolation is safe
    const items = this.db
      .prepare(
        `SELECT ${COLS} FROM employees ${w} ORDER BY ${SORT_COL[q.sort]} ${q.dir === 'desc' ? 'DESC' : 'ASC'}, id LIMIT @limit OFFSET @offset`,
      )
      .all({ ...p, limit: q.pageSize, offset: (q.page - 1) * q.pageSize });
    return { items, total, page: q.page, pageSize: q.pageSize };
  }

  get(id: number) {
    return this.db.prepare(`SELECT ${COLS} FROM employees WHERE id = ?`).get(id);
  }

  create(e: EmployeeInput) {
    const r = this.db.prepare(INSERT).run(e);
    return this.get(Number(r.lastInsertRowid));
  }

  update(id: number, e: EmployeeInput) {
    const r = this.db
      .prepare(
        `UPDATE employees SET full_name=@fullName,email=@email,country=@country,department=@department,job_title=@jobTitle,salary=@salary,hire_date=@hireDate,updated_at=datetime('now') WHERE id=@id`,
      )
      .run({ ...e, id });
    return r.changes ? this.get(id) : undefined;
  }

  remove(id: number) {
    return this.db.prepare('DELETE FROM employees WHERE id = ?').run(id).changes > 0;
  }

  bulkInsert(rows: EmployeeInput[]) {
    const stmt = this.db.prepare(INSERT);
    this.db.transaction((rs: EmployeeInput[]) => rs.forEach((r) => stmt.run(r)))(rows);
  }

  salaryRows() {
    return this.db
      .prepare('SELECT country, department, job_title AS jobTitle, salary FROM employees')
      .all() as { country: CountryCode; department: string; jobTitle: string; salary: number }[];
  }

  departments() {
    return (
      this.db.prepare('SELECT DISTINCT department d FROM employees ORDER BY d').all() as {
        d: string;
      }[]
    ).map((r) => r.d);
  }
}
