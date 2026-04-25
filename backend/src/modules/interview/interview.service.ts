import { eq } from 'drizzle-orm';
import { db } from '../../config/db';
import { env } from '../../config/env';
import { resumeProfiles } from '../../models/schema';
import { AppError } from '../../utils/errors';
import {
  InterviewGenerateRequest,
  InterviewGenerateResponse,
  interviewGenerateResponseSchema,
} from './interview.types';

export class InterviewService {
  static async generateInterview(userId: string, payload: InterviewGenerateRequest): Promise<InterviewGenerateResponse> {
    const profile = await db.query.resumeProfiles.findFirst({
      where: eq(resumeProfiles.userId, userId),
    });

    const merged = {
      targetRole: payload.targetRole || profile?.targetRole || payload.currentRole || profile?.currentRole || 'Software Engineer',
      jobLevel: payload.jobLevel || payload.experience || profile?.experience || 'Mid',
      skills: this.uniqueStrings(payload.skills?.length ? payload.skills : profile?.skills ?? []),
      primaryDomain: payload.primaryDomain || profile?.primaryDomain || 'General Software Development',
      companyType: payload.companyType || 'Product Company',
      focusAreas: this.uniqueStrings(payload.focusAreas ?? []),
      difficulty: payload.difficulty || 'Medium',
      interviewType: payload.interviewType || 'Technical',
      fullName: payload.fullName || profile?.fullName || '',
    };

    try {
      const gemini = await this.generateWithGemini(merged);
      return interviewGenerateResponseSchema.parse(gemini);
    } catch (error) {
      console.warn('[InterviewService] Gemini generation failed, using fallback questions.', error);
      return this.generateFallback(merged);
    }
  }

  private static async generateWithGemini(input: {
    targetRole: string;
    jobLevel: string;
    skills: string[];
    primaryDomain: string;
    companyType: string;
    focusAreas: string[];
    difficulty: string;
    interviewType: string;
    fullName: string;
  }) {
    if (!env.GEMINI_API_KEY) {
      throw new AppError('GEMINI_API_KEY is not configured', 500);
    }

    const prompt = [
      'You are a technical interviewer. Generate 8 interview questions for:',
      `- Role: ${input.targetRole}`,
      `- Level: ${input.jobLevel}`,
      `- Skills: ${input.skills.join(', ') || 'N/A'}`,
      `- Domain: ${input.primaryDomain}`,
      `- Company type: ${input.companyType}`,
      `- Focus areas: ${input.focusAreas.join(', ') || 'N/A'}`,
      `- Difficulty: ${input.difficulty}`,
      '',
      'Return ONLY JSON: { "questions": [{ "id": 1, "question": "...", "type": "technical|behavioral", "hint": "..." }] }',
    ].join('\n');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        }),
      },
    );

    if (!response.ok) {
      throw new AppError(`Gemini request failed (${response.status})`, 502);
    }

    const payload = (await response.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };

    const textResponse = payload.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const parsed = this.extractJson(textResponse);

    if (!parsed) {
      throw new AppError('Gemini response did not contain valid JSON', 502);
    }

    return parsed;
  }

  private static generateFallback(input: {
    targetRole: string;
    skills: string[];
    focusAreas: string[];
    difficulty: string;
  }): InterviewGenerateResponse {
    const baseTopics = this.uniqueStrings([
      ...input.skills,
      ...input.focusAreas,
      input.targetRole,
    ]).slice(0, 8);

    const questions = Array.from({ length: 8 }).map((_, index) => {
      const topic = baseTopics[index] || 'problem solving';
      const technical = index < 6;
      return {
        id: index + 1,
        question: technical
          ? `Explain how you would approach ${topic} for a ${input.targetRole} role.`
          : `Describe a time you handled a difficult situation related to ${topic}.`,
        type: technical ? 'technical' as const : 'behavioral' as const,
        hint: technical
          ? `Discuss trade-offs, constraints, and testing depth at ${input.difficulty} difficulty.`
          : 'Use a structured STAR-style response with measurable outcomes.',
      };
    });

    return { questions };
  }

  private static uniqueStrings(values: string[]) {
    return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
  }

  private static extractJson(rawText: string) {
    if (!rawText) {
      return null;
    }

    const trimmed = rawText.trim();
    const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    const jsonText = fencedMatch?.[1] ?? trimmed;
    const startIndex = jsonText.indexOf('{');
    const endIndex = jsonText.lastIndexOf('}');

    if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
      return null;
    }

    try {
      return JSON.parse(jsonText.slice(startIndex, endIndex + 1)) as unknown;
    } catch {
      return null;
    }
  }
}