export type ResumeAutofillData = {
  fullName: string;
  email: string;
  currentRole: string;
  experience: string;
  skills: string[];
  primaryDomain: string;
  targetRole: string;
};

export const emptyResumeAutofillData: ResumeAutofillData = {
  fullName: '',
  email: '',
  currentRole: '',
  experience: '',
  skills: [],
  primaryDomain: '',
  targetRole: '',
};

export type ResumeUploadResponse = {
  data: ResumeAutofillData;
  meta: {
    source: 'gemini' | 'fallback' | string;
    filePath?: string;
    fileUrl?: string;
    extractedTextLength?: number;
    updatedAt?: string;
  };
};