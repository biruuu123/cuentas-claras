import cors from 'cors';
import express from 'express';
import { config } from './config.ts';
import { errorHandler } from './http/errors.ts';
import { authRouter } from './routes/auth-routes.ts';
import { expenseRouter } from './routes/expense-routes.ts';
import { groupRouter } from './routes/group-routes.ts';

export function createApp() {
  const app = express();
  app.use(cors({ origin: config.frontendUrls }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });
  app.use('/api/auth', authRouter);
  app.use('/api/groups/:groupId/expenses', expenseRouter);
  app.use('/api/groups', groupRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NO_ENCONTRADO', message: 'Ruta inexistente.' } });
  });
  app.use(errorHandler);
  return app;
}
