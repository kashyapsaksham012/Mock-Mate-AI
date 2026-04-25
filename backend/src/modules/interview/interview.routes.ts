import { NextFunction, Request, Response, Router } from 'express';
import { requireAuth, ClerkAuthRequest } from '../../middleware/auth';
import { subscriptionGuard } from '../../middleware/subscriptionGuard';
import { AppError } from '../../utils/errors';
import { InterviewService } from './interview.service';
import { interviewGenerateRequestSchema } from './interview.types';

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

export { router as interviewRoutes };