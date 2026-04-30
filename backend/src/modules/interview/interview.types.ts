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
  deepDiveTopics: z.array(z.string()).optional(),
  notes: z.string().optional(),
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
  success: z.boolean(),
});

export type InterviewAnswerResponse = z.infer<typeof interviewAnswerResponseSchema>;

export const interviewEvaluateRequestSchema = z.object({
  sessionId: z.string().uuid(),
});

export type InterviewEvaluateRequest = z.infer<typeof interviewEvaluateRequestSchema>;

export const interviewEvaluateResponseSchema = z.object({
  overallScore: z.number().min(0).max(10),
  overallFeedback: z.string(),
  improvementTips: z.string(),
  precisionLevel: z.number().min(0).max(100),
  nodesAnalyzed: z.number(),
  growthPotential: z.string(),
  questionBreakdown: z.array(z.object({
    questionId: z.number(),
    score: z.number().min(0).max(100),
    feedback: z.string(),
  })),
});

export type InterviewEvaluateResponse = z.infer<typeof interviewEvaluateResponseSchema>;