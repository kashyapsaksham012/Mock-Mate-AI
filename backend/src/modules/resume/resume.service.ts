import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../../config/env';
import { db } from '../../config/db';
import { users, resumeProfiles } from '../../models/schema';
import { eq } from 'drizzle-orm';
import { AppError } from '../../utils/errors';
import {
  ParserSource,
  resumeAutofillSchema,
  ResumeAutofillData,
  ResumeUploadInput,
  ResumeProfileRecord,
  ResumeUploadResult,
} from './resume.types';

const COMMON_SKILLS = [
  'React',
  'Next.js',
  'TypeScript',
  'JavaScript',
  'Node.js',
  'Express',
  'Python',
  'Java',
  'Go',
  'Rust',
  'C#',
  'SQL',
  'PostgreSQL',
  'MongoDB',
  'Tailwind',
  'GraphQL',
  'REST',
  'AWS',
  'Docker',
  'Kubernetes',
  'Redis',
  'GenAI',
  'LLM',
  'Figma',
  'System Design',
];

export class ResumeService {
  static async parseUploadedResume(input: ResumeUploadInput): Promise<ResumeUploadResult> {
    // ENSURE USER EXISTS (JIT Sync)
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, input.userId),
    });

    if (!existingUser) {
      await db.insert(users).values({
        id: input.userId,
        email: `user_${input.userId}@mockmate.ai`,
        fullName: 'Dev User',
      }).onConflictDoNothing();
    }

    const filePath = await this.persistUpload(input);
    const extractedText = await this.extractText(input.buffer, input.mimeType, input.fileName);
    const parsed = await this.parseResumeText(extractedText);
    const data = resumeAutofillSchema.parse(parsed);

    await this.upsertResumeProfile({
      userId: input.userId,
      data,
      filePath,
      source: parsed.__source,
    });


    return {
      data,
      source: parsed.__source,
      filePath,
      extractedTextLength: extractedText.length,
    };
  }

  static async getProfileByUserId(userId: string): Promise<ResumeProfileRecord | null> {
    const profile = await db.query.resumeProfiles.findFirst({
      where: eq(resumeProfiles.userId, userId),
    });

    return profile ?? null;
  }

  private static async upsertResumeProfile(input: {
    userId: string;
    data: ResumeAutofillData;
    filePath: string;
    source: ParserSource;
  }) {
    await db
      .insert(resumeProfiles)
      .values({
        userId: input.userId,
        fullName: input.data.fullName || null,
        email: input.data.email || null,
        currentRole: input.data.currentRole || null,
        experience: input.data.experience || null,
        skills: input.data.skills,
        primaryDomain: input.data.primaryDomain || null,
        targetRole: input.data.targetRole || null,
        companyType: input.data.companyType || null,
        focusAreas: input.data.focusAreas || null,
        deepDiveTopics: input.data.deepDiveTopics || null,
        notes: input.data.notes || null,
        fileUrl: input.filePath,
        parserSource: input.source,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: resumeProfiles.userId,
        set: {
          fullName: input.data.fullName || null,
          email: input.data.email || null,
          currentRole: input.data.currentRole || null,
          experience: input.data.experience || null,
          skills: input.data.skills,
          primaryDomain: input.data.primaryDomain || null,
          targetRole: input.data.targetRole || null,
          companyType: input.data.companyType || null,
          focusAreas: input.data.focusAreas || null,
          deepDiveTopics: input.data.deepDiveTopics || null,
          notes: input.data.notes || null,
          fileUrl: input.filePath,
          parserSource: input.source,
          updatedAt: new Date(),
        },
      });
  }

  private static async persistUpload(input: ResumeUploadInput) {
    if (this.isCloudinaryConfigured()) {
      return this.persistToCloudinary(input);
    }

    const uploadDir = path.resolve(process.cwd(), env.RESUME_UPLOAD_DIR, input.userId);
    await mkdir(uploadDir, { recursive: true });

    const safeName = path
      .basename(input.fileName || 'resume')
      .replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = path.join(uploadDir, `${Date.now()}-${randomUUID()}-${safeName}`);

    await writeFile(filePath, input.buffer);
    return filePath;
  }

  private static async persistToCloudinary(input: ResumeUploadInput) {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
    });

    const safeBaseName = path
      .basename(input.fileName || 'resume')
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    const ext = path.extname(input.fileName || '').replace('.', '').toLowerCase() || 'bin';
    const publicId = `${input.userId}-${Date.now()}-${randomUUID()}-${safeBaseName}`;

    return new Promise<string>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: env.CLOUDINARY_UPLOAD_FOLDER,
          resource_type: 'auto',
          public_id: publicId,
          format: ext,
          overwrite: false,
          access_mode: 'public',
        },
        (error, result) => {
          if (error || !result?.secure_url) {
            reject(new AppError('Failed to upload resume to Cloudinary', 502));
            return;
          }
          resolve(result.secure_url);
        },
      );

      stream.end(input.buffer);
    });
  }

  private static isCloudinaryConfigured() {
    return Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);
  }

  private static async extractText(buffer: Buffer, mimeType: string, fileName: string) {
    const normalizedMimeType = mimeType.toLowerCase();
    const normalizedExtension = path.extname(fileName).toLowerCase();

    if (normalizedMimeType.includes('pdf') || normalizedExtension === '.pdf') {
      const pdfParseModule = await import('pdf-parse');
      const pdfParse = (pdfParseModule as { default?: (input: Buffer) => Promise<{ text: string }> }).default ??
        (pdfParseModule as unknown as (input: Buffer) => Promise<{ text: string }>);
      const pdfResult = await pdfParse(buffer);
      return pdfResult.text || '';
    }

    if (
      normalizedMimeType.includes('wordprocessingml.document') ||
      normalizedExtension === '.docx'
    ) {
      const mammoth = await import('mammoth');
      const docResult = await mammoth.extractRawText({ buffer });
      return docResult.value || '';
    }

    throw new AppError('Unsupported resume format. Use a PDF or DOCX file.', 400);
  }

  private static async parseResumeText(text: string): Promise<ResumeAutofillData & { __source: ParserSource }> {
    const normalizedText = text.replace(/\r\n/g, '\n').trim();
    if (!normalizedText) {
      throw new AppError('No readable text was found in the uploaded resume.', 400);
    }

    try {
      const geminiResult = await this.parseWithGemini(normalizedText);
      if (geminiResult) {
        return { ...geminiResult, __source: 'gemini' };
      }
    } catch (error) {
      console.warn('[ResumeService] Gemini parsing failed, falling back to deterministic parsing.', error);
    }

    return { ...this.parseFallback(normalizedText), __source: 'fallback' };
  }

  private static async parseWithGemini(text: string): Promise<ResumeAutofillData | null> {
    if (!env.GEMINI_API_KEY) {
      return null;
    }

    const prompt = [
      'Extract a high-fidelity, comprehensive profile from this resume.',
      'Provide a detailed overview of the experience, capturing key achievements and tenure.',
      'Ensure every technical and soft skill mentioned is included in the skills array.',
      'Return ONLY JSON in this exact shape:',
      '{',
      '  "fullName": "Full legal name",',
      '  "email": "Email address",',
      '  "currentRole": "Most recent professional title",',
      '  "experience": "A comprehensive, multi-sentence summary of overall professional experience and key achievements",',
      '  "skills": ["Skill 1", "Skill 2", "..."],',
      '  "primaryDomain": "Broad technical domain (e.g., Full Stack Development, Data Science)",',
      '  "targetRole": "The role the user is likely aiming for based on their trajectory"',
      '}',
      'Be descriptive. Do not truncate experience. If a field is missing, return an empty string or empty array.',
      'Resume text:',
      text,
    ].join('\n');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
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
    const parsedJson = this.extractJson(textResponse);

    if (!parsedJson) {
      throw new AppError('Gemini response did not contain JSON.', 502);
    }

    return this.normalizeResumeData(parsedJson);
  }

  private static parseFallback(text: string): ResumeAutofillData {
    const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    const lines = text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const nameCandidate = lines.find((line) => {
      const cleaned = line.replace(/[^a-zA-Z\s.-]/g, '').trim();
      return cleaned.split(/\s+/).length >= 2 && cleaned.split(/\s+/).length <= 4 && !cleaned.includes('@');
    }) ?? '';

    const roleCandidate = lines.find((line) => /engineer|developer|designer|manager|scientist|analyst/i.test(line)) ?? '';
    const experienceMatch = text.match(/(\d+(?:\.\d+)?)\s*\+?\s*years?/i);
    const skills = this.extractSkills(text);

    return resumeAutofillSchema.parse({
      fullName: nameCandidate,
      email: emailMatch?.[0] ?? '',
      currentRole: roleCandidate,
      experience: experienceMatch ? `${experienceMatch[1]} years` : '',
      skills,
      primaryDomain: this.deriveDomain(roleCandidate, skills),
      targetRole: roleCandidate,
    });
  }

  private static extractSkills(text: string) {
    const lowerText = text.toLowerCase();
    return COMMON_SKILLS.filter((skill) => lowerText.includes(skill.toLowerCase()));
  }

  private static deriveDomain(role: string, skills: string[]) {
    const candidate = `${role} ${skills.join(' ')}`.toLowerCase();

    if (candidate.includes('frontend') || candidate.includes('react') || candidate.includes('ui')) {
      return 'Frontend Development';
    }

    if (candidate.includes('backend') || candidate.includes('node') || candidate.includes('api')) {
      return 'Backend Development';
    }

    if (candidate.includes('data') || candidate.includes('sql') || candidate.includes('analytics')) {
      return 'Data Engineering';
    }

    if (candidate.includes('design') || candidate.includes('figma')) {
      return 'Product Design';
    }

    return '';
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

    const candidate = jsonText.slice(startIndex, endIndex + 1);

    try {
      return JSON.parse(candidate) as unknown;
    } catch {
      return null;
    }
  }

  private static normalizeResumeData(value: unknown): ResumeAutofillData {
    const objectValue = typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};

    return resumeAutofillSchema.parse({
      fullName: this.normalizeString(objectValue.fullName),
      email: this.normalizeString(objectValue.email),
      currentRole: this.normalizeString(objectValue.currentRole),
      experience: this.normalizeString(objectValue.experience),
      skills: this.normalizeStringArray(objectValue.skills),
      primaryDomain: this.normalizeString(objectValue.primaryDomain),
      targetRole: this.normalizeString(objectValue.targetRole),
    });
  }

  private static normalizeString(value: unknown) {
    return typeof value === 'string' ? value.trim() : '';
  }

  private static normalizeStringArray(value: unknown) {
    if (Array.isArray(value)) {
      return value.map((item) => (typeof item === 'string' ? item.trim() : '')).filter(Boolean);
    }

    if (typeof value === 'string') {
      return value
        .split(/,|\n/)
        .map((item) => item.trim())
        .filter(Boolean);
    }

    return [];
  }
}