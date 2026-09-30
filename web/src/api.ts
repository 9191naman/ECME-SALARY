export interface Employee {
  id: number;
  fullName: string;
  email: string;
  country: string;
  department: string;
  jobTitle: string;
  salary: number;
  hireDate: string;
}
export type EmployeeInput = Omit<Employee, 'id'>;
export interface Meta {
  countries: Record<string, { name: string; currency: string }>;
  countryCodes: string[];
  departments: string[];
}
export interface Summary {
  count: number;
  min: number;
  max: number;
  avg: number;
  median: number;
  p90: number;
}
export type Group = Summary & { group: string; currency?: string };
export interface Insights {
  currency: string;
  scope: string;
  overall: Summary;
  payroll: number;
  byCountry: Group[];
  byDepartment: Group[];
  byJobTitle: Group[];
}
export interface Page {
  items: Employee[];
  total: number;
  page: number;
  pageSize: number;
}

export class ApiError extends Error {
  constructor(
    msg: string,
    public details?: Record<string, string[]>,
  ) {
    super(msg);
  }
}

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...init });
  if (r.status === 204) return undefined as T;
  const body = await r.json();
  if (!r.ok) throw new ApiError(body.error ?? 'Request failed', body.details);
  return body;
}

const qs = (o: Record<string, string | number | undefined>) =>
  new URLSearchParams(
    Object.entries(o)
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([k, v]) => [k, String(v)]),
  ).toString();

export const api = {
  meta: () => call<Meta>('/api/meta'),
  list: (p: Record<string, string | number | undefined>) => call<Page>(`/api/employees?${qs(p)}`),
  create: (e: EmployeeInput) =>
    call<Employee>('/api/employees', { method: 'POST', body: JSON.stringify(e) }),
  update: (id: number, e: EmployeeInput) =>
    call<Employee>(`/api/employees/${id}`, { method: 'PUT', body: JSON.stringify(e) }),
  remove: (id: number) => call<void>(`/api/employees/${id}`, { method: 'DELETE' }),
  insights: (country?: string) => call<Insights>(`/api/insights?${qs({ country })}`),
};

export const money = (n: number, currency: string) =>
  new Intl.NumberFormat('en', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
