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

export const interviewAIQuestionsSchema = z.object({
  questions: z.array(interviewQuestionSchema).min(1).max(20),
});

export type InterviewAIQuestions = z.infer<typeof interviewAIQuestionsSchema>;

export const interviewGenerateResponseSchema = z.object({
  sessionId: z.string().uuid(),
  questions: z.array(interviewQuestionSchema).min(1).max(20),
});

export type InterviewGenerateResponse = z.infer<typeof interviewGenerateResponseSchema>;



export const interviewAnswerRequestSchema = z.object({
  sessionId: z.string().uuid(),
  questionId: z.number(),
  answerText: z.string().min(1).max(5000),
});

export type InterviewAnswerRequest = z.infer<typeof interviewAnswerRequestSchema>;

export const interviewAnswerResponseSchema = z.object({
  score: z.number().min(0).max(100),
  aiFeedback: z.string(),
  aiTip: z.string(),
});

export type InterviewAnswerResponse = z.infer<typeof interviewAnswerResponseSchema>;