"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { type InterviewQuestion } from "@/types/interview";
import { InterviewSession } from "@/components/dashboard/interview/InterviewSession";
import { GlobalNavbar } from "@/components/layout/GlobalNavbar";
import { 
  Bell, 
  Settings, 
  XCircle
} from "lucide-react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

export default function InterviewPage() {
  const router = useRouter();
  const [sessionData, setSessionData] = useState<{ sessionId: string; questions: InterviewQuestion[]; duration?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem("current_interview_data");
    if (stored && stored !== "undefined") {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.questions) {
          setSessionData(parsed);
        } else {
          throw new Error("Invalid interview data structure");
        }
      } catch (e) {
        console.error("Failed to parse stored interview data", e);
        sessionStorage.removeItem("current_interview_data"); // Clear bad data
        router.replace("/dashboard");
      }
    } else {
      router.replace("/dashboard");
    }
    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#080C14]">
        <div className="w-12 h-12 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!sessionData) return null;

  return (
    <div className="min-h-screen bg-[#080C14] flex flex-col items-center font-sans antialiased selection:bg-violet-500/30 w-full landing-wrapper">
      {/* Background System */}
      <div className="bg-mesh"></div>
      <div className="bg-grid"></div>
      <div className="bg-noise"></div>

      {/* World-Class Global Navbar */}
      <div className="w-full flex justify-center">
        <GlobalNavbar 
          links={[
            { label: 'Exit Session', href: '/dashboard' },
          ]}
        />
      </div>

      {/* Main Immersive Stage */}
      <main 
        className="flex-grow pt-after-nav pb-12 px-8 flex flex-col items-center relative z-10 w-full"
      >
        <div className="max-w-[1400px] w-full h-full flex flex-col font-heading">
          <InterviewSession 
            questions={sessionData.questions} 
            sessionId={sessionData.sessionId} 
            duration={sessionData.duration}
          />
        </div>
      </main>
    </div>
  );
}
