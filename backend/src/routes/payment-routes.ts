import { Router } from 'express';
import { z } from 'zod';
import { currentUserId, requireAuth } from '../http/auth.ts';
import * as payments from '../services/payment-service.ts';
import { groupParams, paymentParams } from './params.ts';

export const balanceRouter = Router({ mergeParams: true });
balanceRouter.use(requireAuth);
balanceRouter.get('/', async (req, res) => {
  const { groupId } = groupParams.parse(req.params);
  res.json(await payments.getBalances(groupId, currentUserId(res)));
});

export const paymentRouter = Router({ mergeParams: true });
paymentRouter.use(requireAuth);

paymentRouter.get('/', async (req, res) => {
  const { groupId } = groupParams.parse(req.params);
  res.json({ payments: await payments.listPayments(groupId, currentUserId(res)) });
});

paymentRouter.post('/', async (req, res) => {
  const { groupId } = groupParams.parse(req.params);
  const body = z
    .object({ toId: z.number().int().positive(), amount: z.number().int('el monto debe estar en centavos enteros') })
    .parse(req.body);
  res.status(201).json({ payment: await payments.createPayment(groupId, currentUserId(res), body.toId, body.amount) });
});

paymentRouter.post('/:paymentId/resolve', async (req, res) => {
  const { groupId, paymentId } = paymentParams.parse(req.params);
  const { decision } = z.object({ decision: z.enum(['CONFIRMADO', 'RECHAZADO']) }).parse(req.body);
  res.json({ payment: await payments.resolve(groupId, paymentId, currentUserId(res), decision) });
});
