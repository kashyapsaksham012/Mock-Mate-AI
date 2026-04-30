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
      companyType: payload.companyType || profile?.companyType || 'Product Company',
      focusAreas: this.uniqueStrings(payload.focusAreas?.length ? payload.focusAreas : profile?.focusAreas ?? []),
      deepDiveTopics: this.uniqueStrings(payload.deepDiveTopics?.length ? payload.deepDiveTopics : profile?.deepDiveTopics ?? []),
      notes: payload.notes || profile?.notes || '',
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
      companyType: merged.companyType,
      focusAreas: merged.focusAreas,
      deepDiveTopics: merged.deepDiveTopics,
      notes: merged.notes,
      questions,
      status: 'active',
    }).returning();

    // UPDATE USER PREFERENCE (if profile exists)
    if (profile) {
      await db.update(resumeProfiles)
        .set({ 
          lastDifficulty: merged.difficulty,
          targetRole: merged.targetRole,
          companyType: merged.companyType,
          focusAreas: merged.focusAreas,
          deepDiveTopics: merged.deepDiveTopics,
          notes: merged.notes,
          updatedAt: new Date(),
        })
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

    // Fetch user profile for context
    const profile = await db.query.resumeProfiles.findFirst({
      where: eq(resumeProfiles.userId, session.userId),
    });

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
      'You are a high-level executive interviewer. Evaluate this entire session strictly.',
      `- Role: ${session.targetRole}`,
      `- Experience Level: ${profile?.experience || session.difficulty}`,
      `- Core Skills: ${profile?.skills?.join(', ') || 'N/A'}`,
      `- Focus Areas: ${profile?.primaryDomain || 'N/A'}`,
      `- Experience Context: ${orderedAnswers[0]?.answerText.substring(0, 150)}...`,
      '',
      'Questions and User Answers:',
      ...orderedAnswers.map((ans: any) => {
        const q = (session.questions as any[]).find(q => q.id === ans.questionId);
        return `Q: ${q?.question}\nA: ${ans.answerText}\n---`;
      }),
      '',
      'Scoring Requirements:',
      '1. overallScore: 0-10 integer.',
      '2. precisionLevel: 0-100 percentage.',
      '3. nodesAnalyzed: count of technical concepts/keywords used in answers.',
      '4. growthPotential: "Elite", "High", or "Consistent" based on depth.',
      '',
      'Content Requirements (IMPORTANT):',
      `- overallFeedback MUST follow this EXACT pattern: "You completed all ${orderedAnswers.length} questions for the ${session.targetRole} role. The scoring reflects depth, clarity, and technical coverage across your full interview." (Inject the role name naturally).`,
      '- improvementTips: Provide a concise "AI Performance Roadmap" with 2-3 specific implementation-focused tips.',
      '',
      'Return ONLY a valid JSON object:',
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
          generationConfig: { temperature: 0.8, responseMimeType: 'application/json' },
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
    const isBehavioral = input.interviewType?.toLowerCase() === 'behavioral';
    const persona = isBehavioral ? 'behavioral and situational' : 'technical';
    
    const prompt = [
      `You are a ${persona} interviewer. Generate 8 ${input.interviewType || 'technical'} interview questions for:`,
      `- Role: ${input.targetRole}`,
      `- Level: ${input.jobLevel}`,
      `- Skills: ${input.skills.join(', ') || 'N/A'}`,
      `- Domain: ${input.primaryDomain}`,
      `- Company type: ${input.companyType}`,
      `- Focus areas: ${input.focusAreas.join(', ') || 'N/A'}`,
      `- Deep dive topics: ${input.deepDiveTopics.join(', ') || 'N/A'}`,
      `- Additional Instructions/Notes: ${input.notes || 'N/A'}`,
      `- Difficulty: ${input.difficulty}`,
      `- Session Seed: ${Math.random().toString(36).substring(7)}-${Date.now()}`,
      '',
      input.notes ? `CRITICAL: Adhere to these specific candidate requests: ${input.notes}` : '',
      '',
      isBehavioral 
        ? 'Focus on situational, behavioral, and cultural fit questions (e.g., STAR method) relevant to this role and industry. Ensure questions help evaluate soft skills, leadership, and conflict resolution.'
        : `Focus on technical concepts, problem-solving, and architecture. Prioritize the provided "Deep Dive Topics" and "Focus Areas".`,
      '',
      'Ensure each generation produces unique and varied questions. Avoid repeating common patterns.',
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
    interviewType?: string;
  }) {
    const isBehavioral = input.interviewType?.toLowerCase() === 'behavioral';
    const baseTopics = this.uniqueStrings([
      ...input.skills,
      ...input.focusAreas,
      input.targetRole,
    ]).sort(() => Math.random() - 0.5).slice(0, 8);

    const questions = Array.from({ length: 8 }).map((_, index) => {
      const topic = baseTopics[index] || 'professional growth';
      
      const type = isBehavioral ? 'behavioral' : (index < 6 ? 'technical' : 'behavioral');
      const isTechnical = type === 'technical';

      const variations = [
        `Explain how you would approach ${topic} for a ${input.targetRole} role.`,
        `What are the most common challenges you face when working with ${topic}?`,
        `How do you stay updated with the latest developments in ${topic}?`,
        `Describe a complex project where you utilized ${topic} extensively.`,
        `In your opinion, what is the most important aspect of ${topic} for a ${input.targetRole}?`,
      ];

      const behavioralVariations = [
        `Describe a time you handled a difficult situation related to ${topic}.`,
        `Tell me about a situation where you had to make a quick decision about ${topic}.`,
        `Give an example of a time you successfully explained a complex ${topic} concept to a non-technical stakeholder.`,
        `Describe a time you failed while working on ${topic} and what you learned.`,
        `How do you handle disagreements with teammates regarding ${topic}?`,
      ];

      const questionText = isTechnical
        ? variations[Math.floor(Math.random() * variations.length)]
        : behavioralVariations[Math.floor(Math.random() * behavioralVariations.length)];

      return {
        id: index + 1,
        question: questionText,
        type: type as 'technical' | 'behavioral',
        hint: isTechnical
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