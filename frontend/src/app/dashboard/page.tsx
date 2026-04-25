"use client";

import { DashboardNavbar } from "@/components/dashboard/dashboard-navbar";
import { SuccessOverlay } from "@/components/billing/SuccessOverlay";
import { InterviewSetupHeader } from "@/components/dashboard/interview-setup/InterviewSetupHeader";
import { ResumeUploadSection } from "@/components/dashboard/interview-setup/ResumeUploadSection";
import { ManualSetupForm } from "@/components/dashboard/interview-setup/ManualSetupForm";
import { useSubscriptionStatus } from "@/hooks/use-subscription-status";
import { appRoutes } from "@/lib/app-routes";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
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
    transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] as any } 
  }
};

function DashboardContent() {
  const router = useRouter();
  const { status, isLoading, error } = useSubscriptionStatus();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (!sessionId && !isLoading && !error && status !== "active") {
      router.replace(appRoutes.pricing);
    }
  }, [error, isLoading, router, sessionId, status]);

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
      <motion.div variants={itemVariants} className="section-hero w-full flex justify-center">
        <InterviewSetupHeader />
      </motion.div>

      <div className="space-y-[100px] w-full">
        <motion.div variants={itemVariants} className="w-full flex justify-center">
          <ResumeUploadSection />
        </motion.div>

        <motion.div variants={itemVariants} className="w-full">
          <ManualSetupForm />
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

      <DashboardNavbar />

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
