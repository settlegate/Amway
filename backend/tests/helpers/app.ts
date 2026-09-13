import express, { Router } from 'express';

export function buildApp(router: Router, basePath = '/') {
  const app = express();
  app.use(express.json());
  app.use(basePath, router);
  return app;
}

export function prismaError(code: string) {
  return Object.assign(new Error(code), { code });
}
