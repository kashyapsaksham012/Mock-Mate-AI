import { z } from 'zod';

export const parserSourceSchema = z.enum(['gemini', 'fallback']);
export type ParserSource = z.infer<typeof parserSourceSchema>;

export const resumeAutofillSchema = z.object({
  fullName: z.string().default(''),
  email: z.string().default(''),
  currentRole: z.string().default(''),
  experience: z.string().default(''),
  skills: z.array(z.string()).default([]),
  primaryDomain: z.string().default(''),
  targetRole: z.string().default(''),
  companyType: z.string().optional(),
  focusAreas: z.array(z.string()).optional(),
  deepDiveTopics: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export type ResumeAutofillData = z.infer<typeof resumeAutofillSchema>;

export type ResumeUploadResult = {
  data: ResumeAutofillData;
  source: ParserSource;
  filePath: string;
  extractedTextLength: number;
};

export type ResumeUploadInput = {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  userId: string;
};

export type ResumeProfileRecord = {
  id: string;
  userId: string;
  fullName: string | null;
  email: string | null;
  currentRole: string | null;
  experience: string | null;
  skills: string[] | null;
  primaryDomain: string | null;
  targetRole: string | null;
  companyType: string | null;
  focusAreas: string[] | null;
  deepDiveTopics: string[] | null;
  notes: string | null;
  fileUrl: string | null;
  parserSource: string | null;
  updatedAt: Date | null;
};