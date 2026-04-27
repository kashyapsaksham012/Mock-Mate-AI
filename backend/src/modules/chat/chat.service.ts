import { eq, asc, desc } from 'drizzle-orm';
import { db } from '../../config/db';
import { chatSessions, chatMessages } from '../../models/schema';
import { env } from '../../config/env';
import { AppError } from '../../utils/errors';
import { ChatResponse } from './chat.types';

export class ChatService {
  private static readonly SYSTEM_INSTRUCTION = `
You are the MockMate AI Assistant, a professional and helpful guide for the Mock Mate AI application.
Mock Mate AI is an advanced platform that helps users prepare for job interviews through:
1. AI-powered Resume Parsing: Users can upload their resumes to automatically extract skills, experience, and target roles.
2. Custom Mock Interviews: Users can generate technical or behavioral mock interviews tailored to their profile and target job.
3. Realistic Practice: The platform provides real-time feedback and evaluation on interview performance.
4. Subscription Plans: We offer Monthly and Yearly plans for unlimited access.

YOUR RESTRICTIONS:
- You must ONLY answer questions related to Mock Mate AI, its features, pricing, or general career/interview advice.
- If a user asks a question about code (outside of interview context), general knowledge, or anything unrelated to Mock Mate AI, politely decline and steer them back to Mock Mate AI features.
- Keep your tone professional, encouraging, and concise.
- Use Markdown for formatting if helpful.
`.trim();

  static async createSession(userId: string): Promise<string> {
    const [session] = await db.insert(chatSessions).values({
      userId,
    }).returning();
    return session.id;
  }

  static async getHistory(sessionId: string, limit = 50) {
    return await db.query.chatMessages.findMany({
      where: eq(chatMessages.sessionId, sessionId),
      orderBy: [asc(chatMessages.createdAt)],
      limit,
    });
  }

  static async clearSession(sessionId: string) {
    await db.delete(chatMessages).where(eq(chatMessages.sessionId, sessionId));
  }

  static async getChatReply(userId: string, sessionId: string, message: string): Promise<ChatResponse> {
    if (!env.GEMINI_API_KEY) throw new AppError('Gemini not configured', 500);

    // Verify session belongs to user
    const session = await db.query.chatSessions.findFirst({
      where: eq(chatSessions.id, sessionId),
    });

    if (!session || session.userId !== userId) {
      throw new AppError('Session not found or unauthorized', 404);
    }

    // Load history for Gemini
    const history = await this.getHistory(sessionId, 20);

    // Save user message
    await db.insert(chatMessages).values({
      sessionId,
      role: 'user',
      content: message.trim(),
    });

    // Call Gemini
    const geminiHistory = history.map((msg) => ({
      role: msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: geminiHistory.concat([{ role: 'user', parts: [{ text: message.trim() }] }]),
          systemInstruction: { parts: [{ text: this.SYSTEM_INSTRUCTION }] },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[ChatService] Gemini API call failed:`, errorText);
      throw new AppError('Gemini API call failed', 502);
    }

    const data = await response.json() as any;
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "I'm sorry, I'm having trouble thinking right now.";

    // Save model reply
    await db.insert(chatMessages).values({
      sessionId,
      role: 'model',
      content: reply,
    });

    // Update session timestamp
    await db.update(chatSessions)
      .set({ updatedAt: new Date() })
      .where(eq(chatSessions.id, sessionId));

    return { reply };
  }
}
