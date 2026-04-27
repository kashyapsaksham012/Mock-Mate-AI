import { NextFunction, Request, Response, Router } from 'express';
import { requireAuth, ClerkAuthRequest } from '../../middleware/auth';
import { AppError } from '../../utils/errors';
import { ChatService } from './chat.service';
import { chatRequestSchema } from './chat.types';

const router = Router();

// Create new session
router.post('/sessions', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as ClerkAuthRequest).auth.userId;
    const sessionId = await ChatService.createSession(userId);
    res.status(201).json({ sessionId });
  } catch (error) {
    next(error);
  }
});

// Get session history
router.get('/sessions/:id/messages', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const history = await ChatService.getHistory(req.params.id);
    res.json({ messages: history });
  } catch (error) {
    next(error);
  }
});

// Send message
router.post('/sessions/:id/messages', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as ClerkAuthRequest).auth.userId;
    const parse = chatRequestSchema.safeParse(req.body);
    if (!parse.success) {
      throw new AppError('Invalid message payload', 400);
    }

    const result = await ChatService.getChatReply(userId, req.params.id, parse.data.message);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Clear history
router.delete('/sessions/:id/messages', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await ChatService.clearSession(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export { router as chatRoutes };
