import type { Request, Response } from 'express';
import { EmployeeService } from '../services/employeeService.js';

export class EmployeeController {
  constructor(private employeeService: EmployeeService) {}

  health = (_req: Request, res: Response) => {
    res.json({ ok: true });
  };

  getMeta = (_req: Request, res: Response) => {
    res.json(this.employeeService.getMeta());
  };

  listEmployees = (req: Request, res: Response) => {
    res.json(this.employeeService.listEmployees(req.query));
  };

  getEmployee = (req: Request, res: Response) => {
    res.json(this.employeeService.getEmployeeById(req.params.id));
  };

  createEmployee = (req: Request, res: Response) => {
    res.status(201).json(this.employeeService.createEmployee(req.body));
  };

  updateEmployee = (req: Request, res: Response) => {
    res.json(this.employeeService.updateEmployee(req.params.id, req.body));
  };

  deleteEmployee = (req: Request, res: Response) => {
    this.employeeService.deleteEmployee(req.params.id);
    res.status(204).end();
  };

  getInsights = (req: Request, res: Response) => {
    res.json(this.employeeService.getInsights(req.query));
  };
}
