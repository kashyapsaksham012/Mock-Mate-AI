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
  deepDiveTopics?: string[];
  notes?: string;
  difficulty?: string;
  interviewType?: string;
  duration?: string;
};

export type InterviewGenerateResponse = {
  questions: InterviewQuestion[];
  sessionId?: string;
  duration?: string;
};

export type InterviewEvaluateBreakdown = {
  questionId: number;
  score: number;
  feedback: string;
};

export type InterviewEvaluateResponse = {
  overallScore: number;
  overallFeedback: string;
  improvementTips: string;
  precisionLevel: number;
  nodesAnalyzed: number;
  growthPotential: string;
  questionBreakdown: InterviewEvaluateBreakdown[];
};