import { z } from 'zod';

export const interviewGenerateRequestSchema = z.object({
  fullName: z.string().optional(),
  email: z.string().optional(),
  currentRole: z.string().optional(),
  experience: z.string().optional(),
  skills: z.array(z.string()).optional(),
  primaryDomain: z.string().optional(),
  targetRole: z.string().optional(),
  jobLevel: z.string().optional(),
  companyType: z.string().optional(),
  focusAreas: z.array(z.string()).optional(),
  difficulty: z.string().optional(),
  interviewType: z.string().optional(),
});

export type InterviewGenerateRequest = z.infer<typeof interviewGenerateRequestSchema>;

export const interviewQuestionSchema = z.object({
  id: z.number(),
  question: z.string(),
  type: z.enum(['technical', 'behavioral']),
  hint: z.string(),
});

export const interviewGenerateResponseSchema = z.object({
  questions: z.array(interviewQuestionSchema).min(1).max(20),
});

export type InterviewGenerateResponse = z.infer<typeof interviewGenerateResponseSchema>;