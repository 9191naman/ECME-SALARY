import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { openDb } from '../db.js';
import { createApp } from '../app.js';
import { EmployeeRepo } from '../repo/employeeRepo.js';
import { generateEmployees, seedIfEmpty } from '../seed.js';

const valid = {
  fullName: 'Asha Rao',
  email: 'asha@acme.example',
  country: 'IN',
  department: 'Engineering',
  jobTitle: 'Software Engineer',
  salary: 2000000,
  hireDate: '2022-04-01',
};
let app: ReturnType<typeof createApp>;
let db: ReturnType<typeof openDb>;
beforeEach(() => {
  db = openDb();
  app = createApp(db);
});

describe('employees CRUD', () => {
  it('creates, reads, updates and deletes', async () => {
    const created = await request(app).post('/api/employees').send(valid).expect(201);
    const id = created.body.id;
    await request(app).get(`/api/employees/${id}`).expect(200);
    const upd = await request(app)
      .put(`/api/employees/${id}`)
      .send({ ...valid, salary: 2500000 })
      .expect(200);
    expect(upd.body.salary).toBe(2500000);
    await request(app).delete(`/api/employees/${id}`).expect(204);
    await request(app).get(`/api/employees/${id}`).expect(404);
  });
  it('rejects invalid payloads with field errors', async () => {
    const r = await request(app)
      .post('/api/employees')
      .send({ ...valid, salary: -5, country: 'XX' })
      .expect(400);
    expect(r.body.details).toHaveProperty('salary');
    expect(r.body.details).toHaveProperty('country');
  });
  it('returns 409 for duplicate email', async () => {
    await request(app).post('/api/employees').send(valid).expect(201);
    await request(app).post('/api/employees').send(valid).expect(409);
  });
});

describe('listing', () => {
  beforeEach(() => new EmployeeRepo(db).bulkInsert(generateEmployees(200, 1)));
  it('paginates and reports total', async () => {
    const r = await request(app).get('/api/employees?page=2&pageSize=50').expect(200);
    expect(r.body.items).toHaveLength(50);
    expect(r.body.total).toBe(200);
  });
  it('filters by country', async () => {
    const r = await request(app).get('/api/employees?country=IN&pageSize=100').expect(200);
    expect(r.body.items.every((e: { country: string }) => e.country === 'IN')).toBe(true);
  });
  it('sorts by salary desc', async () => {
    const s = (
      await request(app).get('/api/employees?sort=salary&dir=desc&country=US').expect(200)
    ).body.items.map((e: { salary: number }) => e.salary);
    expect(s).toEqual([...s].sort((a, b) => b - a));
  });
  it('rejects unknown sort column', () =>
    request(app).get('/api/employees?sort=salary;DROP').expect(400));
});

describe('insights', () => {
  it('summarises per country in local currency and USD overall', async () => {
    new EmployeeRepo(db).bulkInsert([
      { ...valid, salary: 1000 },
      { ...valid, email: 'b@x.io', salary: 3000 },
      { ...valid, email: 'c@x.io', country: 'US', salary: 100 },
    ] as never);
    const all = (await request(app).get('/api/insights').expect(200)).body;
    expect(all.currency).toBe('USD');
    const india = all.byCountry.find((c: { group: string }) => c.group === 'IN');
    expect(india).toMatchObject({ count: 2, avg: 2000, currency: 'INR' });
    const inOnly = (await request(app).get('/api/insights?country=IN').expect(200)).body;
    expect(inOnly).toMatchObject({ currency: 'INR', payroll: 4000 });
  });
  it('rejects unknown country', () => request(app).get('/api/insights?country=ZZ').expect(400));
});

describe('seed', () => {
  it('is deterministic and idempotent', () => {
    expect(generateEmployees(5, 7)).toEqual(generateEmployees(5, 7));
    expect(seedIfEmpty(db, 50)).toBe(true);
    expect(seedIfEmpty(db, 50)).toBe(false);
  });
  it('produces unique emails and positive salaries', () => {
    const e = generateEmployees(2000);
    expect(new Set(e.map((x) => x.email)).size).toBe(2000);
    expect(e.every((x) => x.salary > 0)).toBe(true);
  });
});
