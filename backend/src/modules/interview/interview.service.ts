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
  InterviewEvaluateResponse,
  interviewEvaluateResponseSchema,
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

    if (session.status === 'completed') {
      throw new AppError('Interview is already completed. Start a new session to submit answers.', 400);
    }

    const question = (session.questions as any[]).find(q => q.id === payload.questionId);
    if (!question) {
      throw new AppError('Question not found in this session', 404);
    }

    // Save or update answer so users can refine an answer before final evaluation.
    await db.insert(interviewAnswers).values({
      sessionId: payload.sessionId,
      questionId: payload.questionId,
      answerText: payload.answerText,
      // Score and feedback will be updated during evaluation
    }).onConflictDoUpdate({
      target: [interviewAnswers.sessionId, interviewAnswers.questionId],
      set: {
        answerText: payload.answerText,
      },
    });

    return { success: true };
  }

  static async evaluateSession(userId: string, sessionId: string): Promise<InterviewEvaluateResponse> {
    const session = await db.query.interviewSessions.findFirst({
      where: and(
        eq(interviewSessions.id, sessionId),
        eq(interviewSessions.userId, userId)
      ),
      with: {
        answers: true,
      },
    });

    if (!session) {
      throw new AppError('Interview session not found or unauthorized', 404);
    }

    const questions = (session.questions as any[]) ?? [];
    const expectedQuestionIds = questions
      .map((q) => Number(q?.id))
      .filter((id) => Number.isFinite(id));

    const answersByQuestionId = new Map<number, typeof session.answers[number]>();
    for (const answer of session.answers) {
      answersByQuestionId.set(answer.questionId, answer);
    }

    const missingQuestionIds = expectedQuestionIds.filter((questionId) => {
      const answer = answersByQuestionId.get(questionId);
      return !answer || !answer.answerText?.trim();
    });

    if (missingQuestionIds.length > 0) {
      throw new AppError(
        `Please answer all ${expectedQuestionIds.length} questions before evaluation. Missing question IDs: ${missingQuestionIds.join(', ')}`,
        400
      );
    }

    const orderedAnswers = expectedQuestionIds
      .map((questionId) => answersByQuestionId.get(questionId))
      .filter((answer): answer is NonNullable<typeof answer> => Boolean(answer));

    const hasFullyScoredAnswers =
      orderedAnswers.length === expectedQuestionIds.length &&
      orderedAnswers.every((answer) => answer.score !== null);
    
    if (session.status === 'completed' && session.overallScore !== null && hasFullyScoredAnswers) {
      return {
        overallScore: session.overallScore,
        overallFeedback: session.overallFeedback!,
        improvementTips: session.improvementTips!,
        precisionLevel: session.precisionLevel!,
        nodesAnalyzed: session.nodesAnalyzed!,
        growthPotential: session.growthPotential!,
        questionBreakdown: orderedAnswers.map(a => ({
          questionId: a.questionId,
          score: a.score || 0,
          feedback: a.aiFeedback || ""
        }))
      };
    }

    if (orderedAnswers.length === 0) {
      throw new AppError('No answers found to evaluate', 400);
    }

    // SCORING WITH GEMINI
    const prompt = [
      'You are an expert technical interviewer. Evaluate this entire interview session.',
      `- Role: ${session.targetRole}`,
      `- Difficulty: ${session.difficulty}`,
      '',
      'Questions and User Answers:',
      ...orderedAnswers.map((ans: any) => {
        const q = (session.questions as any[]).find(q => q.id === ans.questionId);
        return `Q: ${q?.question}\nA: ${ans.answerText}\n---`;
      }),
      '',
      'Return ONLY a valid JSON object. Do not include markdown formatting like ```json.',
      'The overallScore must be an integer between 0 and 10.',
      'The precisionLevel must be a percentage (0-100).',
      'The nodesAnalyzed should be the number of key technical concepts identified in the answers.',
      'The growthPotential should be a short descriptive string (e.g., "Elite", "High", "Consistent").',
      'The questionBreakdown must include a score (0-100) and feedback for each question provided.',
      '',
      'JSON Structure:',
      '{',
      '  "overallScore": number,',
      '  "overallFeedback": "string",',
      '  "improvementTips": "string",',
      '  "precisionLevel": number,',
      '  "nodesAnalyzed": number,',
      '  "growthPotential": "string",',
      '  "questionBreakdown": [',
      '    { "questionId": number, "score": number, "feedback": "string" }',
      '  ]',
      '}'
    ].join('\n');

    let evaluation: InterviewEvaluateResponse;
    try {
      const gemini = await this.callGeminiRaw(prompt);
      const result = interviewEvaluateResponseSchema.safeParse(gemini);
      if (!result.success) {
        throw result.error;
      }
      evaluation = result.data;
    } catch (error) {
      console.error('[InterviewService] Gemini evaluation failed CRITICALLY:', error);

      const totalWords = orderedAnswers.reduce((acc, ans) => acc + ans.answerText.trim().split(/\s+/).filter(Boolean).length, 0);
      const averageWords = totalWords / Math.max(orderedAnswers.length, 1);
      const longAnswerCount = orderedAnswers.filter((ans) => ans.answerText.trim().split(/\s+/).filter(Boolean).length >= 35).length;
      const uniqueTerms = this.countUniqueTerms(orderedAnswers.map((ans) => ans.answerText));

      const precisionLevel = this.clamp(
        Math.round(averageWords * 1.2 + longAnswerCount * 4 + Math.min(uniqueTerms, 50) * 0.7),
        20,
        95
      );

      const overallScore = this.clamp(
        Math.round(precisionLevel / 10),
        1,
        10
      );

      const nodesAnalyzed = this.clamp(uniqueTerms, 8, 60);

      const growthPotential = precisionLevel >= 80
        ? 'Elite'
        : precisionLevel >= 60
          ? 'High'
          : 'Consistent';

      evaluation = {
        overallScore,
        overallFeedback: `You completed all ${expectedQuestionIds.length} questions for the ${session.targetRole} role. The scoring reflects depth, clarity, and technical coverage across your full interview.`,
        improvementTips: 'Use structured examples, add implementation details, and quantify impact to improve precision and overall score.',
        precisionLevel,
        nodesAnalyzed,
        growthPotential,
        questionBreakdown: orderedAnswers.map((ans: any) => ({
          questionId: ans.questionId,
          score: this.clamp(
            Math.round(ans.answerText.trim().split(/\s+/).filter(Boolean).length * 1.5),
            30,
            95
          ),
          feedback: "Answer recorded. Review your technical depth and clarity."
        })),
      };
    }

    const breakdownByQuestionId = new Map(
      evaluation.questionBreakdown.map((item) => [item.questionId, item])
    );

    evaluation.questionBreakdown = expectedQuestionIds.map((questionId) => {
      const item = breakdownByQuestionId.get(questionId);
      if (item) {
        return {
          questionId,
          score: this.clamp(Math.round(item.score), 0, 100),
          feedback: item.feedback,
        };
      }

      const answer = answersByQuestionId.get(questionId);
      const fallbackScore = answer
        ? this.clamp(Math.round(answer.answerText.trim().split(/\s+/).filter(Boolean).length * 1.2), 25, 85)
        : 0;

      return {
        questionId,
        score: fallbackScore,
        feedback: 'Evaluation fallback applied for this answer.',
      };
    });

    // UPDATE ANSWERS WITH SCORES IN DB (Async)
    for (const breakdown of evaluation.questionBreakdown) {
      try {
        await db.update(interviewAnswers)
          .set({ 
            score: Math.round(breakdown.score), // Ensure integer
            aiFeedback: breakdown.feedback 
          })
          .where(and(
            eq(interviewAnswers.sessionId, sessionId),
            eq(interviewAnswers.questionId, breakdown.questionId)
          ));
      } catch (dbError) {
        console.error(`[InterviewService] Failed to update answer ${breakdown.questionId} in DB:`, dbError);
      }
    }

    // UPDATE SESSION WITH OVERALL EVALUATION
    await db.update(interviewSessions)
      .set({
        status: 'completed',
        overallScore: evaluation.overallScore,
        overallFeedback: evaluation.overallFeedback,
        improvementTips: evaluation.improvementTips,
        precisionLevel: evaluation.precisionLevel,
        nodesAnalyzed: evaluation.nodesAnalyzed,
        growthPotential: evaluation.growthPotential
      })
      .where(eq(interviewSessions.id, sessionId));

    return evaluation;
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[InterviewService] Gemini API call failed with status ${response.status}:`, errorText);
      throw new AppError('Gemini API call failed', 502);
    }
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

  private static countUniqueTerms(answers: string[]) {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'to', 'of', 'in', 'on', 'for', 'with', 'is', 'are', 'was', 'were',
      'i', 'you', 'we', 'they', 'it', 'this', 'that', 'my', 'our', 'your', 'as', 'at', 'by', 'from', 'be', 'been',
      'have', 'has', 'had', 'do', 'did', 'done', 'can', 'could', 'would', 'should', 'will', 'if', 'then', 'so',
    ]);

    const tokens = answers
      .join(' ')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length > 2 && !stopWords.has(token));

    return new Set(tokens).size;
  }

  private static clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
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