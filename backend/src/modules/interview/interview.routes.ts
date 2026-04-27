import { NextFunction, Request, Response, Router } from 'express';
import { requireAuth, ClerkAuthRequest } from '../../middleware/auth';
import { subscriptionGuard } from '../../middleware/subscriptionGuard';
import { AppError } from '../../utils/errors';
import { InterviewService } from './interview.service';
import { interviewGenerateRequestSchema, interviewAnswerRequestSchema } from './interview.types';

const router = Router();

router.post('/generate', requireAuth, subscriptionGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as ClerkAuthRequest;
    const userId = authReq.auth?.userId;

    if (!userId) {
      throw new AppError('Missing authenticated user', 401);
    }

    const parse = interviewGenerateRequestSchema.safeParse(req.body ?? {});
    if (!parse.success) {
      throw new AppError('Invalid interview generation payload', 400);
    }

    const generated = await InterviewService.generateInterview(userId, parse.data);
    res.json({ data: generated });
  } catch (error) {
    next(error);
  }
});

router.post('/answer', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as ClerkAuthRequest;
    const userId = authReq.auth?.userId;
    if (!userId) throw new AppError('Unauthorized', 401);

    const parse = interviewAnswerRequestSchema.safeParse(req.body);
    if (!parse.success) throw new AppError('Invalid answer payload', 400);

    const result = await InterviewService.submitAnswer(userId, parse.data);
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
});

router.post('/evaluate', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as ClerkAuthRequest;
    const userId = authReq.auth?.userId;
    if (!userId) throw new AppError('Unauthorized', 401);

    const { sessionId } = req.body;
    if (!sessionId) throw new AppError('Missing sessionId', 400);

    const result = await InterviewService.evaluateSession(userId, sessionId);
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
});


export { router as interviewRoutes };