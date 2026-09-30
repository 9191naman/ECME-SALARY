import { Router } from 'express';
import { EmployeeController } from '../controllers/employeeController.js';
import { EmployeeService } from '../services/employeeService.js';

export const createEmployeeRoutes = (employeeService: EmployeeService) => {
  const router = Router();
  const controller = new EmployeeController(employeeService);

  router.get('/health', controller.health);
  router.get('/meta', controller.getMeta);
  router.get('/employees', controller.listEmployees);
  router.get('/employees/:id', controller.getEmployee);
  router.post('/employees', controller.createEmployee);
  router.put('/employees/:id', controller.updateEmployee);
  router.delete('/employees/:id', controller.deleteEmployee);
  router.get('/insights', controller.getInsights);

  return router;
};
