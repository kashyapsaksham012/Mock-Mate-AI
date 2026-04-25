"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { type InterviewQuestion } from "@/types/interview";
import { 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Lightbulb, 
  MessageSquare, 
  Trophy,
  ArrowRight,
  Home
} from "lucide-react";
import Link from "next/link";
import { appRoutes } from "@/lib/app-routes";

interface InterviewSessionProps {
  questions: InterviewQuestion[];
}

export function InterviewSession({ questions }: InterviewSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowHint(false);
    } else {
      setIsCompleted(true);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowHint(false);
    }
  };

  if (isCompleted) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="premium-card p-12 flex flex-col items-center text-center space-y-6 max-w-2xl mx-auto mt-12"
      >
        <div className="w-20 h-20 rounded-full bg-accent-primary/20 flex items-center justify-center mb-4">
          <Trophy className="w-10 h-10 text-accent-primary" />
        </div>
        <h2 className="font-heading text-4xl uppercase tracking-tight">Interview Completed!</h2>
        <p className="text-text-muted text-lg">
          You've successfully navigated through all {questions.length} questions. 
          Great job practicing for your upcoming interview!
        </p>
        <div className="flex gap-4 pt-4">
          <Link href="/dashboard" className="premium-button">
            <Home className="w-4 h-4 mr-2" />
            Return to Dashboard
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-accent-highlight font-medium">Question {currentIndex + 1} of {questions.length}</p>
            <h3 className="text-lg font-medium">Session in Progress</h3>
          </div>
          <p className="text-sm font-mono text-text-muted">{Math.round(progress)}%</p>
        </div>
        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-accent-primary to-accent-highlight"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 50, damping: 20 }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="relative"
        >
          {/* Main Question Card */}
          <div className="premium-card p-10 md:p-16 min-h-[400px] flex flex-col justify-center">
            <div className="absolute top-8 left-8">
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest text-text-muted">
                {currentQuestion.type}
              </span>
            </div>

            <div className="space-y-8">
              <div className="flex gap-6 items-start">
                <div className="mt-1 p-3 rounded-2xl bg-accent-primary/10 border border-accent-primary/20">
                  <MessageSquare className="w-6 h-6 text-accent-primary" />
                </div>
                <h2 className="text-2xl md:text-4xl font-heading leading-tight">
                  {currentQuestion.question}
                </h2>
              </div>

              {/* Hint Section */}
              <div className="pt-4">
                <button 
                  onClick={() => setShowHint(!showHint)}
                  className="flex items-center gap-2 text-sm text-accent-highlight hover:text-white transition-colors group"
                >
                  <Lightbulb className={`w-4 h-4 ${showHint ? "fill-accent-highlight" : "group-hover:fill-accent-highlight/30"}`} />
                  {showHint ? "Hide Interviewer's Hint" : "Need a Hint?"}
                </button>
                
                <AnimatePresence>
                  {showHint && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 p-6 rounded-2xl bg-white/[0.03] border border-white/5 text-text-muted italic leading-relaxed">
                        &ldquo;{currentQuestion.hint}&rdquo;
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Controls */}
      <div className="flex justify-between items-center pt-4">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className={`flex items-center gap-2 px-6 py-3 rounded-full border border-white/10 transition-all ${
            currentIndex === 0 
              ? "opacity-30 cursor-not-allowed" 
              : "bg-white/5 hover:bg-white/10 text-white"
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
          Previous
        </button>

        <button
          onClick={handleNext}
          className="flex items-center gap-2 px-8 py-3 rounded-full bg-accent-primary hover:bg-accent-primary/90 text-black font-semibold transition-all group"
        >
          {currentIndex === questions.length - 1 ? (
            <>
              Finish Session
              <CheckCircle2 className="w-5 h-5" />
            </>
          ) : (
            <>
              Next Question
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
