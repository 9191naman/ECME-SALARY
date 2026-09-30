import { z } from 'zod';
import { COUNTRY_CODES } from './countries.js';

export const employeeInput = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email(),
  country: z.enum(COUNTRY_CODES),
  department: z.string().trim().min(2).max(60),
  jobTitle: z.string().trim().min(2).max(80),
  salary: z.number().int().positive().max(1_000_000_000), // annual, whole local currency units
  hireDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
});
export type EmployeeInput = z.infer<typeof employeeInput>;

export const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  q: z.string().trim().optional(),
  country: z.enum(COUNTRY_CODES).optional(),
  department: z.string().trim().optional(),
  sort: z.enum(['fullName', 'salary', 'hireDate', 'country', 'department']).default('fullName'),
  dir: z.enum(['asc', 'desc']).default('asc'),
});
export type ListQuery = z.infer<typeof listQuery>;
