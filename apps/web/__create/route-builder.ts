import { Hono } from 'hono';
import type { Handler } from 'hono/types';
import updatedFetch from '../src/__create/fetch';
import * as attendanceRoute from '../src/app/api/attendance/route.js';
import * as authExpoWebSuccessRoute from '../src/app/api/auth/expo-web-success/route.js';
import * as authLoginRoute from '../src/app/api/auth/login/route.js';
import * as authLogoutRoute from '../src/app/api/auth/logout/route.js';
import * as authTokenRoute from '../src/app/api/auth/token/route.js';
import * as dashboardRoute from '../src/app/api/dashboard/route.js';
import * as employeeTodayRoute from '../src/app/api/employee/today/route.js';
import * as employeesRoute from '../src/app/api/employees/route.js';
import * as meRoute from '../src/app/api/me/route.js';
import * as objectsRoute from '../src/app/api/objects/route.js';
import * as setupRoute from '../src/app/api/setup/route.js';

const API_BASENAME = '/api';
const api = new Hono();

if (globalThis.fetch) {
  globalThis.fetch = updatedFetch;
}

type RouteModule = Record<string, unknown>;

const routes: Array<[string, RouteModule]> = [
  ['/attendance', attendanceRoute],
  ['/auth/expo-web-success', authExpoWebSuccessRoute],
  ['/auth/login', authLoginRoute],
  ['/auth/logout', authLogoutRoute],
  ['/auth/token', authTokenRoute],
  ['/dashboard', dashboardRoute],
  ['/employee/today', employeeTodayRoute],
  ['/employees', employeesRoute],
  ['/me', meRoute],
  ['/objects', objectsRoute],
  ['/setup', setupRoute],
];

const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const;

for (const [path, route] of routes) {
  for (const method of methods) {
    const handlerFn = route[method];
    if (typeof handlerFn !== 'function') continue;

    const handler: Handler = async (c) => {
      return handlerFn(c.req.raw, { params: c.req.param() });
    };

    switch (method) {
      case 'GET':
        api.get(path, handler);
        break;
      case 'POST':
        api.post(path, handler);
        break;
      case 'PUT':
        api.put(path, handler);
        break;
      case 'DELETE':
        api.delete(path, handler);
        break;
      case 'PATCH':
        api.patch(path, handler);
        break;
    }
  }
}

export { api, API_BASENAME };
