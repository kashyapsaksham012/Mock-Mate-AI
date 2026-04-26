"use client";

import { GlobalNavbar } from "@/components/layout/GlobalNavbar";
import { SuccessOverlay } from "@/components/billing/SuccessOverlay";
import { InterviewSetupHeader } from "@/components/dashboard/interview-setup/InterviewSetupHeader";
import { ResumeUploadSection } from "@/components/dashboard/interview-setup/ResumeUploadSection";
import { ManualSetupForm } from "@/components/dashboard/interview-setup/ManualSetupForm";
import { useAuth } from "@clerk/nextjs";
import { useSubscriptionStatus } from "@/hooks/use-subscription-status";
import { appRoutes } from "@/lib/app-routes";
import { generateInterview } from "@/lib/interview";
import { fetchResumeProfile } from "@/lib/resume-autofill";
import { type InterviewGenerateRequest, type InterviewQuestion } from "@/types/interview";
import { emptyResumeAutofillData, type ResumeAutofillData } from "@/types/resume";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { motion } from "framer-motion";

const dashboardVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] as const } 
  }
};

function DashboardContent() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { status, isLoading, error } = useSubscriptionStatus();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [resumeData, setResumeData] = useState<ResumeAutofillData>(emptyResumeAutofillData);
  const [hasResumeData, setHasResumeData] = useState(false);
  const [resumeVersion, setResumeVersion] = useState(0);
  const [isGeneratingInterview, setIsGeneratingInterview] = useState(false);
  const [interviewError, setInterviewError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);

  useEffect(() => {
    if (!sessionId && !isLoading && !error && status !== "active") {
      router.replace(appRoutes.pricing);
    }
  }, [error, isLoading, router, sessionId, status]);

  useEffect(() => {
    if (isLoading || status !== "active") {
      return;
    }

    let cancelled = false;

    const loadProfile = async () => {
      try {
        const token = await getToken();
        const profile = await fetchResumeProfile(token);
        if (!cancelled && profile?.data) {
          setResumeData(profile.data);
          setHasResumeData(true);
          setResumeVersion((version) => version + 1);
        }
      } catch (loadError) {
        if (!cancelled) {
          console.warn("[Dashboard] Failed to preload resume profile", loadError);
        }
      }
    };

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [getToken, isLoading, status]);

  const handleResumeParsed = (data: ResumeAutofillData) => {
    setResumeData(data);
    setHasResumeData(true);
    setResumeVersion((version) => version + 1);
  };

  const handleResumeCleared = () => {
    setResumeData(emptyResumeAutofillData);
    setHasResumeData(false);
    setResumeVersion((version) => version + 1);
  };

  const handleStartInterview = async (payload: InterviewGenerateRequest) => {
    try {
      setInterviewError(null);
      setIsGeneratingInterview(true);

      const token = await getToken();
      const generated = await generateInterview(payload, token);
      
      if (generated) {
        return generated;
      } else {
        throw new Error("No interview data generated");
      }
    } catch (generationError) {
      setQuestions([]);
      const message = generationError instanceof Error ? generationError.message : "Failed to generate interview questions";
      setInterviewError(message);
      throw new Error(message); // Re-throw to allow component-level handling
    } finally {
      setIsGeneratingInterview(false);
    }
  };


  if (isLoading && !sessionId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-2 border-accent-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <motion.div 
      variants={dashboardVariants}
      initial="hidden"
      animate="visible"
      className="premium-container flex flex-col items-center w-full"
    >
      <motion.div 
        variants={itemVariants} 
        className="section-hero w-full flex justify-center"
        style={{ paddingTop: '280px' }}
      >
        <InterviewSetupHeader />
      </motion.div>

      <div className="space-y-[100px] w-full">
        <motion.div variants={itemVariants} className="w-full flex justify-center">
            <ResumeUploadSection onResumeParsed={handleResumeParsed} onResumeCleared={handleResumeCleared} />
        </motion.div>

        <motion.div variants={itemVariants} className="w-full">
          <ManualSetupForm
            key={resumeVersion}
            resumeData={resumeData}
            hasResumeData={hasResumeData}
            onStartInterview={handleStartInterview}
            isGeneratingInterview={isGeneratingInterview}
          />
        </motion.div>

        <motion.div variants={itemVariants} className="w-full max-w-[1100px] mx-auto">
          <div className="premium-card p-8">
            <h3 className="font-heading text-xl uppercase tracking-wide mb-4">Interview Session Preview</h3>
            {interviewError ? <p className="text-red-400 mb-4">{interviewError}</p> : null}
            {questions.length === 0 ? (
              <p className="text-text-muted">Generate an interview session to view your question set here.</p>
            ) : (
              <div className="space-y-4">
                {questions.map((question) => (
                  <div key={question.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <p className="text-sm uppercase tracking-wider text-accent-highlight">Q{question.id}</p>
                      <p className="text-xs uppercase tracking-wider text-text-muted">{question.type}</p>
                    </div>
                    <p className="font-medium mb-2">{question.question}</p>
                    <p className="text-sm text-text-muted">Hint: {question.hint}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  return (
    <main className="min-h-screen relative overflow-x-hidden landing-wrapper">
      {/* High-End Brand Background */}
      <div className="bg-aurora" />
      <div className="bg-noise-overlay" />

      <GlobalNavbar />

      {/* Main Content Area */}
      <section className="relative z-10 pb-20 flex justify-center w-full">
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-10 h-10 border-2 border-accent-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        }>
          <SuccessOverlay />
          <DashboardContent />
        </Suspense>
      </section>
    </main>
  );
}
