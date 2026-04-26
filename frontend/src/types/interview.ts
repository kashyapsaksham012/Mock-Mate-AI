export type InterviewQuestion = {
  id: number;
  question: string;
  type: 'technical' | 'behavioral';
  hint: string;
};

export type InterviewGenerateRequest = {
  fullName?: string;
  email?: string;
  currentRole?: string;
  experience?: string;
  skills?: string[];
  primaryDomain?: string;
  targetRole?: string;
  jobLevel?: string;
  companyType?: string;
  focusAreas?: string[];
  difficulty?: string;
  interviewType?: string;
  duration?: string;
};

export type InterviewGenerateResponse = {
  questions: InterviewQuestion[];
  sessionId?: string;
  duration?: string;
};