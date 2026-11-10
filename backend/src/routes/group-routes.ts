import { Router } from 'express';
import { z } from 'zod';
import { currentUserId, requireAuth } from '../http/auth.ts';
import * as groups from '../services/group-service.ts';
import { groupParams, memberParams } from './params.ts';

export const groupRouter = Router();
groupRouter.use(requireAuth);

groupRouter.get('/', async (_req, res) => {
  res.json({ groups: await groups.listGroups(currentUserId(res)) });
});

groupRouter.post('/', async (req, res) => {
  const { name } = z.object({ name: z.string().trim().min(1, 'el nombre es obligatorio').max(80) }).parse(req.body);
  res.status(201).json({ group: await groups.createGroup(currentUserId(res), name) });
});

groupRouter.get('/:groupId', async (req, res) => {
  const { groupId } = groupParams.parse(req.params);
  res.json({ group: await groups.getGroup(groupId, currentUserId(res)) });
});

groupRouter.post('/:groupId/members', async (req, res) => {
  const { groupId } = groupParams.parse(req.params);
  const { email } = z.object({ email: z.string().trim().email('email inválido') }).parse(req.body);
  res.status(201).json({ group: await groups.addMember(groupId, currentUserId(res), email) });
});

groupRouter.delete('/:groupId/members/:userId', async (req, res) => {
  const { groupId, userId } = memberParams.parse(req.params);
  res.json({ group: await groups.removeMember(groupId, currentUserId(res), userId) });
});
