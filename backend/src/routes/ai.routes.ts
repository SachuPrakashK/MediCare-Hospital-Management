import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { aiConversationService as service } from '../services/ai-conversation.service.js';
import { asyncHandler } from '../utils/async-handler.js';
import { AppError } from '../utils/app-error.js';

export const aiRoutes = Router();
aiRoutes.use(authenticate);
aiRoutes.use(
  rateLimit({
    windowMs: 60_000,
    limit: 30,
    keyGenerator: (request) => request.auth!.userId,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  }),
);

const idRequest = z.object({
  body: z.object({}).passthrough().optional(),
  query: z.object({}).passthrough(),
  params: z.object({ id: z.uuid() }),
});

aiRoutes.post(
  '/conversations',
  asyncHandler(async (request, response) =>
    response.status(201).json({ data: await service.create(request.auth!.userId) }),
  ),
);
aiRoutes.get(
  '/conversations',
  asyncHandler(async (request, response) =>
    response.json({ data: await service.list(request.auth!.userId) }),
  ),
);
aiRoutes.get(
  '/conversations/:id',
  validate(idRequest),
  asyncHandler(async (request, response) =>
    response.json({ data: await service.detail(String(request.params.id), request.auth!.userId) }),
  ),
);
aiRoutes.delete(
  '/conversations/:id',
  validate(idRequest),
  asyncHandler(async (request, response) => {
    await service.remove(String(request.params.id), request.auth!.userId);
    response.json({ data: null });
  }),
);
aiRoutes.post(
  '/conversations/:id/cancel',
  validate(idRequest),
  asyncHandler(async (request, response) => {
    const id = String(request.params.id);
    await service.detail(id, request.auth!.userId);
    response.json({ data: { cancelled: service.cancel(id, request.auth!.userId) } });
  }),
);
aiRoutes.post(
  '/conversations/:id/messages',
  validate(
    z.object({
      body: z.object({ content: z.string().trim().min(1).max(4_000) }),
      query: z.object({}).passthrough(),
      params: z.object({ id: z.uuid() }),
    }),
  ),
  asyncHandler(async (request, response) => {
    response.status(200);
    response.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    response.setHeader('Cache-Control', 'no-cache, no-transform');
    response.setHeader('Connection', 'keep-alive');
    response.flushHeaders();
    request.once('aborted', () => service.cancel(String(request.params.id), request.auth!.userId));
    try {
      for await (const event of service.send(
        String(request.params.id),
        request.auth!.userId,
        request.auth!.permissions,
        request.body.content,
      )) {
        if (event.text)
          response.write(`event: delta\ndata: ${JSON.stringify({ text: event.text })}\n\n`);
      }
      response.write('event: done\ndata: {}\n\n');
    } catch (error) {
      const message =
        error instanceof AppError
          ? error.message
          : 'Aira could not complete the response. Please try again.';
      response.write(`event: error\ndata: ${JSON.stringify({ message })}\n\n`);
    } finally {
      response.end();
    }
  }),
);
