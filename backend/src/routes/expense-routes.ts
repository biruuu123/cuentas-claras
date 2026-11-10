import { Router } from 'express';
import { z } from 'zod';
import { currentUserId, requireAuth } from '../http/auth.ts';
import * as expenses from '../services/expense-service.ts';
import { expenseParams, groupParams } from './params.ts';

const userId = z.number().int().positive();
const cents = z.number().int('el monto debe estar en centavos enteros');

const expenseSchema = z.object({
  description: z.string().trim().min(1, 'la descripción es obligatoria').max(120),
  amount: cents,
  payerId: userId,
  split: z.discriminatedUnion('type', [
    z.object({ type: z.literal('IGUAL'), participants: z.array(userId).max(50) }),
    z.object({
      type: z.literal('PORCENTAJE'),
      parts: z.array(z.object({ userId, basisPoints: z.number().int() })).max(50),
    }),
    z.object({ type: z.literal('EXACTO'), parts: z.array(z.object({ userId, amount: cents })).max(50) }),
  ]),
});

export const expenseRouter = Router({ mergeParams: true });
expenseRouter.use(requireAuth);

expenseRouter.get('/', async (req, res) => {
  const { groupId } = groupParams.parse(req.params);
  res.json({ expenses: await expenses.listExpenses(groupId, currentUserId(res)) });
});

expenseRouter.post('/', async (req, res) => {
  const { groupId } = groupParams.parse(req.params);
  const body = expenseSchema.parse(req.body);
  res.status(201).json({ expense: await expenses.createExpense(groupId, currentUserId(res), body) });
});

expenseRouter.put('/:expenseId', async (req, res) => {
  const { groupId, expenseId } = expenseParams.parse(req.params);
  const body = expenseSchema.parse(req.body);
  res.json({ expense: await expenses.updateExpense(groupId, expenseId, currentUserId(res), body) });
});

expenseRouter.delete('/:expenseId', async (req, res) => {
  const { groupId, expenseId } = expenseParams.parse(req.params);
  await expenses.deleteExpense(groupId, expenseId, currentUserId(res));
  res.status(204).end();
});
