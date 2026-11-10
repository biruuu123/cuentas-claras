import { z } from 'zod';

const id = z.coerce.number().int().positive();

export const groupParams = z.object({ groupId: id });
export const memberParams = z.object({ groupId: id, userId: id });
export const expenseParams = z.object({ groupId: id, expenseId: id });
export const paymentParams = z.object({ groupId: id, paymentId: id });
