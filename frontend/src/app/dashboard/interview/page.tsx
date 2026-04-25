"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { type InterviewQuestion } from "@/types/interview";
import { InterviewSession } from "@/components/dashboard/interview/InterviewSession";
import { DashboardNavbar } from "@/components/dashboard/dashboard-navbar";

export default function InterviewPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<InterviewQuestion[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Attempt to load questions from sessionStorage
    const stored = sessionStorage.getItem("current_interview_questions");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as InterviewQuestion[];
        setQuestions(parsed);
      } catch (e) {
        console.error("Failed to parse stored questions", e);
        router.replace("/dashboard");
      }
    } else {
      // No questions found, redirect back
      router.replace("/dashboard");
    }
    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-10 h-10 border-2 border-accent-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!questions) return null;

  return (
    <main className="min-h-screen relative overflow-x-hidden landing-wrapper">
      <div className="bg-aurora" />
      <div className="bg-noise-overlay" />
      
      <DashboardNavbar />

      <section className="relative z-10 pt-20 pb-20 flex justify-center w-full px-4">
        <div className="w-full max-w-[1200px]">
          <InterviewSession questions={questions} />
        </div>
      </section>
    </main>
  );
}
