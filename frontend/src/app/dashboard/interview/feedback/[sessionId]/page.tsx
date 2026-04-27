"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@clerk/nextjs";
import { toast } from "react-toastify";
import { 
  Trophy, 
  Home, 
  Sparkles, 
  Lightbulb, 
  ChevronRight, 
  CheckCircle2, 
  Target,
  BarChart3,
  TrendingUp
} from "lucide-react";
import Link from "next/link";
import { GlobalNavbar } from "@/components/layout/GlobalNavbar";
import { evaluateInterview } from "@/lib/interview";
import { InterviewEvaluateResponse } from "@/types/interview";

export default function FeedbackPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const { getToken, isLoaded } = useAuth();
  const router = useRouter();
  
  const [feedback, setFeedback] = useState<InterviewEvaluateResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFeedback() {
      if (!isLoaded) return;
      
      try {
        const token = await getToken();
        if (!token) {
          router.push("/sign-in");
          return;
        }

        const data = await evaluateInterview(sessionId, token);
        setFeedback(data);
        toast.success("AI Evaluation Complete", {
          style: { borderRadius: '16px' }
        });
      } catch (err: any) {
        console.error(err);
        setError(err.message);
        toast.error("Evaluation Sync Failed", {
          style: { borderRadius: '16px' }
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchFeedback();
  }, [sessionId, isLoaded, getToken, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080C14] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin"></div>
          <p className="text-white/40 font-black uppercase tracking-[0.4em] animate-pulse">Neural Evaluation in Progress...</p>
        </div>
      </div>
    );
  }

  if (error || !feedback) {
    return (
      <div className="min-h-screen bg-[#080C14] flex flex-col items-center justify-center p-8">
        <div className="premium-card p-12 text-center space-y-6 max-w-md">
          <h2 className="text-2xl font-bold text-white">Evaluation Error</h2>
          <p className="text-white/60">{error || "We couldn't retrieve your performance data."}</p>
          <Link href="/dashboard" className="btn-premium-primary w-full py-4">Return to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080C14] flex flex-col items-center font-sans antialiased selection:bg-violet-500/30 overflow-x-hidden w-full landing-wrapper">
      <div className="bg-mesh"></div>
      <div className="bg-grid"></div>
      <div className="bg-noise"></div>
      
      <div className="w-full flex justify-center">
        <GlobalNavbar links={[{ label: 'Dashboard', href: '/dashboard' }]} />
      </div>

      <main className="flex-grow pt-after-nav pb-20 px-8 relative z-10 w-full flex flex-col items-center">
        <div className="max-w-[1200px] w-full space-y-20">
          
          {/* Hero Section */}
          <div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="premium-card p-16 flex flex-col items-center text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 primary-gradient"></div>
              <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px]"></div>
              
              <div className="w-32 h-32 rounded-[40px] bg-violet-500/10 flex items-center justify-center relative mb-10 group">
                <Trophy className="w-16 h-16 text-violet-400 group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 rounded-[40px] border border-violet-500/20 group-hover:border-violet-500/40 transition-colors"></div>
              </div>

              <div className="space-y-4 max-w-3xl">
                <h1 className="text-7xl font-black tracking-tighter text-white font-heading">SESSION SCORE: {feedback.overallScore}/10</h1>
                <p className="text-white/40 text-xl font-medium leading-relaxed">
                  {feedback.overallFeedback}
                </p>
              </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mt-16">
                 <div className="bg-white/[0.02] border border-white/5 p-10 rounded-[40px] backdrop-blur-xl">
                   <Target className="w-8 h-8 text-violet-400 mb-4 mx-auto" />
                   <div className="text-4xl font-bold text-white mb-1 font-heading">{feedback.precisionLevel}%</div>
                   <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Precision Level</div>
                 </div>
                 <div className="bg-white/[0.02] border border-white/5 p-10 rounded-[40px] backdrop-blur-xl">
                   <BarChart3 className="w-8 h-8 text-blue-400 mb-4 mx-auto" />
                   <div className="text-4xl font-bold text-white mb-1 font-heading">{feedback.nodesAnalyzed}</div>
                   <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Nodes Analyzed</div>
                 </div>
                 <div className="bg-white/[0.02] border border-white/5 p-10 rounded-[40px] backdrop-blur-xl">
                   <TrendingUp className="w-8 h-8 text-emerald-400 mb-4 mx-auto" />
                   <div className="text-4xl font-bold text-white mb-1 font-heading">{feedback.growthPotential}</div>
                   <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Growth Potential</div>
                 </div>
               </div>
            </motion.div>
          </div>

          {/* Actionable Tips */}
          <div className="py-10">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-violet-500/5 border border-violet-500/10 rounded-[48px] p-12 flex flex-col md:flex-row items-center gap-10"
            >
              <div className="w-20 h-20 rounded-3xl bg-violet-500/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-10 h-10 text-violet-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xs font-black text-violet-400 uppercase tracking-[0.5em] font-heading">AI Performance Roadmap</h3>
                <p className="text-white/80 text-xl font-medium leading-relaxed">{feedback.improvementTips}</p>
              </div>
            </motion.div>
          </div>

          {/* Question Breakdown */}
          <div className="space-y-16 py-10">
            <h2 className="text-4xl font-black text-white uppercase tracking-tight flex items-center gap-6 pl-4 font-heading">
              Detailed Breakdown
              <div className="flex-grow h-px bg-white/5"></div>
            </h2>

            <div className="grid grid-cols-1 gap-8">
              {feedback.questionBreakdown.map((item, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="premium-card p-12 group hover:bg-white/[0.03] transition-all duration-700 relative overflow-hidden"
                >
                  <div className="flex flex-col lg:flex-row justify-between gap-10 relative z-10">
                    <div className="space-y-6 flex-grow">
                      <div className="flex items-center gap-4">
                         <span className="text-[10px] font-black text-violet-500 uppercase tracking-[0.6em] font-heading">Module {idx + 1}</span>
                         <CheckCircle2 className="w-4 h-4 text-emerald-500/40" />
                      </div>
                      <p className="text-2xl font-bold text-white/90 leading-snug tracking-tight">
                        {item.feedback}
                      </p>
                    </div>

                    <div className="flex items-center gap-10 shrink-0">
                       <div className="flex flex-col items-end gap-1">
                          <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] font-heading">Accuracy</span>
                          <div className="text-5xl font-black text-white tracking-tighter font-heading">{item.score}%</div>
                       </div>
                       <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-violet-500/10 transition-colors">
                          <BarChart3 className="w-6 h-6 text-white/20 group-hover:text-violet-400 transition-colors" />
                       </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Final Actions */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 pt-10">
             <Link href="/dashboard" className="btn-premium-primary px-20 h-20 flex items-center gap-5 text-xl font-heading">
               <Home className="w-6 h-6" />
               BACK TO COMMAND CENTER
             </Link>
             <button 
              onClick={() => router.push("/dashboard")}
              className="px-12 h-20 rounded-[32px] border border-white/10 text-white/40 font-black uppercase tracking-[0.4em] hover:bg-white/5 transition-all text-sm font-heading"
             >
               Archive Session
             </button>
          </div>

        </div>
      </main>
    </div>
  );
}
