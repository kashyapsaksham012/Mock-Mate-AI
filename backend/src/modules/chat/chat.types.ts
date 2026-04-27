import { z } from 'zod';

export const chatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string().min(1).max(4000),
});

export const chatRequestSchema = z.object({
  message: z.string().min(1).max(4000),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;

export interface ChatResponse {
  reply: string;
}
