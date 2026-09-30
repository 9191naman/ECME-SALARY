import { COUNTRIES, COUNTRY_CODES } from '../domain/countries.js';
import { buildInsights } from '../insights.js';
import { employeeInput, listQuery } from '../domain/validation.js';
import { EmployeeRepo } from '../repo/employeeRepo.js';
import { HttpError, parseId } from '../utils/httpError.js';

export class EmployeeService {
  constructor(private repo: EmployeeRepo) {}

  getMeta() {
    return {
      countries: COUNTRIES,
      countryCodes: COUNTRY_CODES,
      departments: this.repo.departments(),
    };
  }

  listEmployees(query: Record<string, unknown>) {
    return this.repo.list(listQuery.parse(query));
  }

  getEmployeeById(idParam: string) {
    const id = parseId(idParam);
    const employee = this.repo.get(id);
    if (!employee) throw new HttpError(404, 'Employee not found');
    return employee;
  }

  createEmployee(payload: unknown) {
    return this.repo.create(employeeInput.parse(payload));
  }

  updateEmployee(idParam: string, payload: unknown) {
    const id = parseId(idParam);
    const employee = this.repo.update(id, employeeInput.parse(payload));
    if (!employee) throw new HttpError(404, 'Employee not found');
    return employee;
  }

  deleteEmployee(idParam: string) {
    const id = parseId(idParam);
    if (!this.repo.remove(id)) throw new HttpError(404, 'Employee not found');
    return true;
  }

  getInsights(query: Record<string, unknown>) {
    const country = query.country;
    if (country !== undefined && !COUNTRY_CODES.includes(country as never)) {
      throw new HttpError(400, 'Unknown country');
    }

    return buildInsights(this.repo, country as never);
  }
}
