import { Router } from 'express';
import { z } from 'zod';
import { currentUserId, requireAuth, signToken } from '../http/auth.ts';
import * as auth from '../services/auth-service.ts';

const registerSchema = z.object({
  email: z.string().trim().email('email inválido').max(200),
  name: z.string().trim().min(1, 'el nombre es obligatorio').max(80),
  password: z.string().max(200),
});

const loginSchema = z.object({
  email: z.string().trim().min(1),
  password: z.string().min(1),
});

export const authRouter = Router();

authRouter.post('/register', async (req, res) => {
  const body = registerSchema.parse(req.body);
  const user = await auth.register(body.email, body.name, body.password);
  res.status(201).json({ token: signToken(user.id), user });
});

authRouter.post('/login', async (req, res) => {
  const body = loginSchema.parse(req.body);
  const user = await auth.login(body.email, body.password);
  res.json({ token: signToken(user.id), user });
});

authRouter.get('/me', requireAuth, async (req, res) => {
  res.json({ user: await auth.getUser(currentUserId(res)) });
});
