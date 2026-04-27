"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { type InterviewQuestion } from "@/types/interview";
import { Trophy, Home, Send, Zap, Mic, VideoOff, Timer, ChevronRight, Lightbulb, Sparkles } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import Webcam from "react-webcam";

interface InterviewSessionProps {
  questions: InterviewQuestion[];
  sessionId: string;
  duration?: string;
}

interface AnswerFeedback {
  score: number;
  aiFeedback: string;
  aiTip: string;
}

export function InterviewSession({ questions, sessionId, duration }: InterviewSessionProps) {
  const router = useRouter();
  const { getToken } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [response, setResponse] = useState("");
  
  // Dynamic timer initialization
  const [timeLeft, setTimeLeft] = useState(() => {
    if (duration) {
      const mins = parseInt(duration);
      if (!isNaN(mins)) return mins * 60;
    }
    return 1800; // Default 30 mins
  });
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeechRecognitionSupported, setIsSpeechRecognitionSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'interviewing' | 'completed'>('interviewing');

  const recognitionRef = useRef<any>(null);
  const speechPrefixRef = useRef("");
  const speechCommittedRef = useRef("");
  const currentQuestion = questions[currentIndex];

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      setIsSpeechRecognitionSupported(true);
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = typeof navigator !== 'undefined' ? navigator.language : 'en-US';

      recognitionRef.current.onstart = () => {
        setIsRecording(true);
      };

      recognitionRef.current.onresult = (event: any) => {
        let committedTranscript = speechCommittedRef.current;
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            committedTranscript += `${transcript.trim()} `;
          } else {
            interimTranscript += transcript;
          }
        }

        speechCommittedRef.current = committedTranscript;
        const liveTranscript = `${speechPrefixRef.current}${committedTranscript}${interimTranscript}`;
        setResponse(liveTranscript.trimStart());
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event?.error ?? event);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    } else {
      setIsSpeechRecognitionSupported(false);
    }

    return () => {
      recognitionRef.current?.stop?.();
    }
  }, []);

  // Timer logic
  useEffect(() => {
    if (status === 'completed') return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [status]);

  // Speak question when it changes
  useEffect(() => {
    if (status === 'interviewing') {
      speakQuestion(currentQuestion.question);
    }
  }, [currentIndex, status]);

  const speakQuestion = (text: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.pitch = 1;
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      speechPrefixRef.current = response ? `${response.trimEnd()} ` : '';
      speechCommittedRef.current = '';
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };

  const handleSubmit = async () => {
    if (!response.trim() || isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      if (!backendUrl) {
        throw new Error("NEXT_PUBLIC_BACKEND_URL is not configured");
      }

      const token = await getToken();
      if (!token) {
        throw new Error("You must be signed in to submit an interview answer");
      }

      const res = await fetch(`${backendUrl}/api/interview/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionId,
          questionId: currentQuestion.id,
          answerText: response
        })
      });

      if (!res.ok) {
        throw new Error("Failed to save response");
      }

      toast.success(`Response ${currentIndex + 1} synchronized`, {
        style: { borderRadius: '16px' }
      });

      // Move to next or complete
      if (currentIndex < questions.length - 1) {
        handleNext();
      } else {
        router.push(`/dashboard/interview/feedback/${sessionId}`);
      }
    } catch (error: any) {
      console.error("Failed to submit answer", error);
      toast.error(error.message || "Network Error: Sync Failed", {
        style: { borderRadius: '16px' }
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    }

    setCurrentIndex(currentIndex + 1);
    setResponse("");
    speechPrefixRef.current = '';
    speechCommittedRef.current = '';
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (status === 'completed') {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="w-12 h-12 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10 w-full h-full">
      {/* Interaction Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 flex-grow">
        {/* Left Wing: AI Interviewer */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="premium-card flex-grow relative overflow-hidden bg-black/20 min-h-[500px] shadow-[0_0_100px_-20px_rgba(99,102,241,0.2)] border-white/5">
            <div className="w-full h-full relative group">
              {isCameraEnabled ? (
                <Webcam
                  audio={false}
                  mirrored={true}
                  className="w-full h-full object-cover grayscale-[0.2] contrast-[1.1] scale-110"
                  videoConstraints={{
                    width: 1280,
                    height: 720,
                    facingMode: "user"
                  }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-white/[0.02] backdrop-blur-3xl">
                  <div className="w-32 h-32 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-6">
                    <VideoOff className="w-12 h-12 text-violet-400 opacity-40" />
                  </div>
                  <span className="text-xs font-black text-white/20 uppercase tracking-[0.5em]">Camera Signal Blocked</span>
                </div>
              )}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>

            {/* Status Overlays */}
            <div className="absolute top-8 left-8 flex flex-col gap-3">
              <div className="bg-white/5 backdrop-blur-2xl border border-white/10 px-5 py-2.5 rounded-2xl flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${isCameraEnabled ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-red-500'}`}></div>
                <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">
                  {isCameraEnabled ? 'Neural Stream: Active' : 'Sensor Blocked'}
                </span>
              </div>
            </div>

            {/* Media Controls */}
            <div className="absolute bottom-8 right-8 flex gap-4">
              <button 
                onClick={() => setIsCameraEnabled(!isCameraEnabled)}
                className={`w-16 h-16 rounded-[24px] backdrop-blur-3xl flex items-center justify-center transition-all duration-500 group ${isCameraEnabled ? 'bg-white/5 border border-white/10 text-white hover:bg-white/10' : 'bg-red-500/20 border border-red-500/40 text-red-500'}`}
              >
                <span className="material-symbols-outlined text-3xl group-hover:scale-110 transition-transform">{isCameraEnabled ? 'videocam' : 'videocam_off'}</span>
              </button>
            </div>
          </div>

          <div className="premium-card p-8 bg-violet-500/5 border-violet-500/10">
             <div className="flex items-center gap-4 mb-4">
               <Lightbulb className="w-5 h-5 text-amber-400" />
               <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">AI Strategy Hint</span>
             </div>
             <p className="text-white/70 italic text-sm leading-relaxed">"{currentQuestion.hint}"</p>
          </div>
        </div>

        {/* Right Wing: Question & Response */}
        <div className="lg:col-span-7 flex flex-col gap-10">
          <AnimatePresence mode="wait">
            <motion.div 
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-10 h-full"
            >
                <div className="premium-card p-14 flex flex-col justify-center relative overflow-hidden min-h-[300px]">
                  <div className="absolute -top-24 -left-24 w-64 h-64 bg-violet-500/5 rounded-full blur-[80px]"></div>
                  <div className="relative z-10 space-y-8">
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-violet-400 uppercase tracking-[0.5em] font-heading">Question {currentIndex + 1} / {questions.length}</span>
                        <span className="text-[9px] font-black text-white/20 uppercase tracking-widest font-heading">{currentQuestion.type}</span>
                      </div>
                      
                      <div className={`min-w-[210px] h-18 rounded-[24px] flex items-center px-6 gap-5 shadow-[0_0_80px_-10px_rgba(99,102,241,0.15)] transition-all duration-1000 border backdrop-blur-[30px] relative overflow-hidden group/timer ${
                        timeLeft < 300 
                          ? 'border-red-500/30 bg-red-500/5' 
                          : 'border-white/10 bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/20'
                      }`}>
                        {/* Compact Premium Glows */}
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-violet-500/5 via-transparent to-transparent" />
                        
                        <div className="relative flex items-center justify-center w-10 h-10 rounded-[14px] bg-white/5 border border-white/5 shadow-inner shrink-0 group-hover/timer:scale-105 transition-transform duration-500">
                          <Timer className={`w-5 h-5 ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-violet-400'}`} />
                        </div>

                        <div className="flex flex-col justify-center whitespace-nowrap relative z-10">
                          <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] mb-0.5 leading-none font-heading">Session Clock</span>
                          <span className={`text-2xl font-mono font-black tracking-tight transition-colors duration-500 leading-none ${timeLeft < 300 ? 'text-red-500' : 'text-white'}`}>
                            {formatTime(timeLeft)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <h1 className="text-base md:text-lg font-medium text-white/80 leading-relaxed">
                      {currentQuestion.question}
                    </h1>
                  </div>
                </div>

                <div className="flex-grow flex flex-col gap-5">
                  <div className="flex justify-between items-center px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-violet-400 shadow-[0_0_10px_rgba(139,92,246,0.5)]"></div>
                      <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Neural Transcription</span>
                    </div>
                    <span className="text-[10px] font-bold text-white/10 uppercase tracking-widest font-mono bg-white/5 px-4 py-1 rounded-full">{response.length} / 5000</span>
                  </div>
                  
                  <div className="relative group flex-grow min-h-[350px] flex flex-col">
                    <div className="absolute inset-0 bg-white/[0.01] border border-white/5 rounded-3xl pointer-events-none group-focus-within:border-violet-500/30 group-focus-within:bg-white/[0.03] transition-all duration-700"></div>
                    <textarea 
                      value={response}
                      onChange={(e) => {
                        const nextValue = e.target.value;
                        setResponse(nextValue);

                        if (!isRecording) {
                          speechPrefixRef.current = nextValue;
                          speechCommittedRef.current = '';
                        }
                      }}
                      className="w-full h-full bg-transparent border-none rounded-3xl px-20 py-16 text-white outline-none transition-all resize-none text-2xl font-medium leading-[1.8] placeholder:text-white/5 custom-scrollbar relative z-10"
                      placeholder="Your response will materialize here as you speak or type..."
                    />
                  </div>

                  <div className="flex flex-col md:flex-row justify-between items-center px-8 py-6 bg-white/[0.01] border border-white/5 rounded-[32px] backdrop-blur-[60px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] relative group/bar gap-8">
                    {/* Atmospheric Lighting */}
                    <div className="absolute -left-32 top-1/2 -translate-y-1/2 w-80 h-80 bg-violet-600/10 rounded-full blur-[100px] opacity-0 group-hover/bar:opacity-100 transition-opacity duration-1000"></div>
                    <div className="absolute -right-32 top-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px] opacity-0 group-hover/bar:opacity-100 transition-opacity duration-1000"></div>

                    {/* Integrated Voice Architecture */}
                    <div className="flex items-center gap-8 relative z-10">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4 ml-[10px]">Neural Voice Architecture</span>
                        <div className="flex items-center gap-6">
                          <button 
                            onClick={toggleRecording}
                            disabled={!isSpeechRecognitionSupported}
                            className={`relative w-14 h-14 rounded-[20px] flex items-center justify-center transition-all duration-700 group/mic shadow-2xl ${
                              isRecording 
                                ? 'bg-red-500 border-red-400/50' 
                                : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:scale-105 active:scale-95'
                            }`}
                          >
                            <Mic className={`w-6 h-6 ${isRecording ? 'text-white animate-pulse' : 'text-white/40 group-hover/mic:text-white transition-colors duration-500'}`} />
                            {isRecording && (
                              <motion.div 
                                animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0, 0.4] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute inset-0 bg-red-500 rounded-[20px] blur-2xl"
                              />
                            )}
                          </button>

                          <div className="flex flex-col gap-2">
                            <span className={`text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-700 ${isRecording ? 'text-red-400 drop-shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'text-white/30'}`}>
                              {!isSpeechRecognitionSupported ? 'System Restricted' : isRecording ? 'Neural Capture Synchronized' : 'Core: Standby'}
                            </span>
                            
                            <div className="flex items-center gap-1 h-4">
                              {(isRecording || isSpeaking) ? (
                                [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                                  <motion.div
                                    key={i}
                                    animate={{ 
                                      height: isRecording ? [4, 16, 4] : [4, 10, 4],
                                      backgroundColor: isRecording ? '#F87171' : '#A78BFA',
                                      opacity: [0.3, 1, 0.3]
                                    }}
                                    transition={{ 
                                      duration: 0.6, 
                                      repeat: Infinity, 
                                      delay: i * 0.04 
                                    }}
                                    className="w-0.5 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                                  />
                                ))
                              ) : (
                                <div className="flex gap-1">
                                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                                    <div key={i} className="w-0.5 h-1 bg-white/5 rounded-full" />
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Mission-Critical Submission Button */}
                    <div className="flex items-center gap-6 relative z-10">
                      <button 
                        onClick={handleSubmit}
                        disabled={!response.trim() || isSubmitting || isRecording}
                        className="group relative flex items-center justify-center w-[300px] px-8 py-5 rounded-[24px] bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-700 hover:from-indigo-500 hover:via-violet-500 hover:to-fuchsia-600 disabled:opacity-20 disabled:grayscale transition-all duration-700 shadow-[0_30px_100px_-20px_rgba(99,102,241,0.6)] border-t border-white/30 overflow-hidden active:scale-95 text-center font-heading"
                      >
                        {/* Enhanced Hover Overlay */}
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 backdrop-blur-sm" />
                        
                        <div className="flex flex-col items-center justify-center relative z-10">
                          <span className="text-[9px] font-black text-white/50 uppercase tracking-[0.25em] mb-1 group-hover:text-white/80 transition-colors whitespace-nowrap">Neural Sync</span>
                          <span className="text-xs font-black text-white uppercase tracking-[0.3em] drop-shadow-2xl whitespace-nowrap">
                            {isSubmitting ? 'ANALYZING...' : 'COMMIT RESPONSE'}
                          </span>
                        </div>
                        
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 z-20">
                          {isSubmitting ? (
                            <div className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors duration-700 border border-white/10">
                              <Send className="w-4 h-4 text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-700 ease-out" />
                            </div>
                          )}
                        </div>

                        {/* Subtle scanner effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

      {/* Neural Status Bar (Cinematic) */}
      <footer className="flex flex-wrap gap-16 items-center justify-between py-12 border-t border-white/5 px-12">
        <div className="flex items-center gap-20 pl-12">
          <div className="flex items-center gap-5 text-white/10 group cursor-default">
             <motion.div 
               animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.2, 1] }}
               transition={{ duration: 2, repeat: Infinity }}
               className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]"
             />
            <span className="text-[10px] font-black uppercase tracking-[0.6em] group-hover:text-emerald-400 transition-colors font-heading">Neural Core: Optimized</span>
          </div>
          <div className="flex items-center gap-5 text-white/10 group cursor-default">
            <span className="material-symbols-outlined text-violet-400/50 text-2xl group-hover:scale-125 transition-transform duration-500">model_training</span>
            <span className="text-[10px] font-black uppercase tracking-[0.6em] group-hover:text-white transition-colors font-heading">
              Model: {process.env.NEXT_PUBLIC_AI_MODEL || 'Gemini 1.5 Flash'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-10">
          <span className="text-[10px] font-black text-white/5 uppercase tracking-[0.5em] font-heading">Real-time Calibrations:</span>
          {['Semantics', 'Sentiment', 'Fluency'].map((area) => (
            <span key={area} className="bg-white/[0.03] text-white/20 px-10 py-4 rounded-2xl text-[9px] font-black border border-white/5 uppercase tracking-[0.4em] hover:text-white hover:border-violet-500/30 transition-all cursor-default font-heading">
              {area}
            </span>
          ))}
        </div>
      </footer>
    </div>
  );
}
