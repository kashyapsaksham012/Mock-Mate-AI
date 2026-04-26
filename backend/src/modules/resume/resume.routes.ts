import express, { Router } from 'express';
import { requireAuth, ClerkAuthRequest } from '../../middleware/auth';
import { subscriptionGuard } from '../../middleware/subscriptionGuard';
import { AppError } from '../../utils/errors';
import { ResumeService } from './resume.service';
import multer from 'multer';

const router = Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

/**
 * @route POST /api/resume/upload
 * @desc Upload and parse a resume file (PDF/DOCX)
 */
router.post(
  '/upload',
  requireAuth,
  subscriptionGuard,
  upload.single('file'), 
  async (req, res, next) => {
    try {
      const authReq = req as ClerkAuthRequest;
      const userId = authReq.auth?.userId;

      if (!req.file) {
        throw new AppError('Resume file is required. Key: file', 400);
      }

      const result = await ResumeService.parseUploadedResume({
        buffer: req.file.buffer,
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        userId: userId!,
      });

      res.json({
        data: result.data,
        meta: {
          source: result.source,
          filePath: result.filePath,
          extractedTextLength: result.extractedTextLength,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @route GET /api/resume/profile
 * @desc Get the current user's parsed resume profile
 */
router.get('/profile', requireAuth, subscriptionGuard, async (req, res, next) => {
  try {
    const userId = (req as ClerkAuthRequest).auth?.userId;
    const profile = await ResumeService.getProfileByUserId(userId!);
    res.json({ data: profile });
  } catch (error) { next(error); }
});

export { router as resumeRoutes };