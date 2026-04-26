import { eq, and } from 'drizzle-orm';
import { db } from '../../config/db';
import { env } from '../../config/env';
import { users, resumeProfiles, interviewSessions, interviewAnswers } from '../../models/schema';
import { AppError } from '../../utils/errors';
import {
  InterviewGenerateRequest,
  InterviewGenerateResponse,
  interviewGenerateResponseSchema,
  interviewAIQuestionsSchema,
  InterviewAnswerRequest,
  InterviewAnswerResponse,
  interviewAnswerResponseSchema,
} from './interview.types';

export class InterviewService {
  static async generateInterview(userId: string, payload: InterviewGenerateRequest): Promise<InterviewGenerateResponse> {
    // ENSURE USER EXISTS (Just-In-Time Sync if webhook was slow/missing)
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!existingUser && payload.email) {
      await db.insert(users).values({
        id: userId,
        email: payload.email,
        fullName: payload.fullName || 'User',
      }).onConflictDoNothing();
    }

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

    let questions: any[];
    try {
      const gemini = await this.generateWithGemini(merged);
      const parsed = interviewAIQuestionsSchema.parse(gemini);
      questions = parsed.questions;
    } catch (error) {
      console.warn('[InterviewService] Gemini generation failed, using fallback questions.', error);
      const fallback = this.generateFallback(merged);
      questions = fallback.questions;
    }

    // SAVE TO DATABASE
    const [session] = await db.insert(interviewSessions).values({
      userId,
      targetRole: merged.targetRole,
      difficulty: merged.difficulty,
      questions,
      status: 'active',
    }).returning();

    // UPDATE USER PREFERENCE (if profile exists)
    if (profile) {
      await db.update(resumeProfiles)
        .set({ lastDifficulty: merged.difficulty })
        .where(eq(resumeProfiles.userId, userId));
    }

    return { questions, sessionId: session.id };
  }


  static async submitAnswer(userId: string, payload: InterviewAnswerRequest): Promise<InterviewAnswerResponse> {
    const session = await db.query.interviewSessions.findFirst({
      where: and(
        eq(interviewSessions.id, payload.sessionId),
        eq(interviewSessions.userId, userId)
      ),
    });

    if (!session) {
      throw new AppError('Interview session not found or unauthorized', 404);
    }

    const question = (session.questions as any[]).find(q => q.id === payload.questionId);
    if (!question) {
      throw new AppError('Question not found in this session', 404);
    }

    // SCORING WITH GEMINI
    const prompt = [
      'You are an expert interviewer. Rate the user\'s response to this interview question.',
      `- Question: ${question.question}`,
      `- Context: ${session.targetRole} role, ${session.difficulty} difficulty`,
      `- User's Answer: ${payload.answerText}`,
      '',
      'Return ONLY JSON: { "score": 85, "aiFeedback": "Detailed feedback...", "aiTip": "Actionable tip..." }',
    ].join('\n');

    let scoring: InterviewAnswerResponse;
    try {
      const gemini = await this.callGeminiRaw(prompt);
      scoring = interviewAnswerResponseSchema.parse(gemini);
    } catch (error) {
      console.warn('[InterviewService] Gemini scoring failed, using fallback.', error);
      scoring = {
        score: 70,
        aiFeedback: "Your answer has been received. Aim for more specific examples using the STAR method.",
        aiTip: "Try to quantify your achievements with data or specific metrics."
      };
    }

    // SAVE ANSWER
    await db.insert(interviewAnswers).values({
      sessionId: payload.sessionId,
      questionId: payload.questionId,
      answerText: payload.answerText,
      score: scoring.score,
      aiFeedback: scoring.aiFeedback,
      aiTip: scoring.aiTip,
    });

    return scoring;
  }


  private static async callGeminiRaw(prompt: string) {
    if (!env.GEMINI_API_KEY) throw new AppError('Gemini not configured', 500);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
        }),
      }
    );

    if (!response.ok) throw new AppError('Gemini API call failed', 502);
    const data = await response.json() as any;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return this.extractJson(text);
  }

  private static async generateWithGemini(input: any) {
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
    return this.callGeminiRaw(prompt);
  }

  private static generateFallback(input: {
    targetRole: string;
    skills: string[];
    focusAreas: string[];
    difficulty: string;
  }) {
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
    if (!rawText) return null;
    const startIndex = rawText.indexOf('{');
    const endIndex = rawText.lastIndexOf('}');
    if (startIndex === -1 || endIndex === -1) return null;
    try {
      return JSON.parse(rawText.slice(startIndex, endIndex + 1));
    } catch {
      return null;
    }
  }
}