"use client";

import { useState, useEffect, useRef } from "react";
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
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [status, setStatus] = useState<'interviewing' | 'feedback' | 'completed'>('interviewing');
  const [allFeedbacks, setAllFeedbacks] = useState<(AnswerFeedback & { question: string, answer: string })[]>([]);

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

      const data = await res.json();
      if (data.data) {
        const newFeedback = {
          ...data.data,
          question: currentQuestion.question,
          answer: response
        };
        setFeedback(data.data);
        setAllFeedbacks(prev => [...prev, newFeedback]);
        setStatus('feedback');
      }
    } catch (error) {
      console.error("Failed to submit answer", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setResponse("");
      speechPrefixRef.current = '';
      speechCommittedRef.current = '';
      setFeedback(null);
      setStatus('interviewing');
    } else {
      setStatus('completed');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (status === 'completed') {
    const avgScore = Math.round(allFeedbacks.length > 0 ? allFeedbacks.reduce((acc, curr) => acc + curr.score, 0) / allFeedbacks.length : 0);
    
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col gap-12 w-full pb-20"
      >
        <div className="premium-card p-16 flex flex-col items-center text-center space-y-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 primary-gradient"></div>
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-violet-500/10 rounded-full blur-[100px]"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px]"></div>

          <div className="w-28 h-28 rounded-3xl bg-violet-500/10 flex items-center justify-center relative group">
            <Trophy className="w-14 h-14 text-violet-400 group-hover:scale-110 transition-transform duration-500" />
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
              className="absolute inset-0 rounded-3xl border-2 border-dashed border-violet-500/30"
            />
          </div>
          
          <div className="space-y-4 relative z-10">
            <h1 className="text-6xl font-bold tracking-tighter text-white">INTERVIEW COMPLETE</h1>
            <p className="text-white/40 text-xl max-w-2xl mx-auto font-medium">
              Exceptional work! You've navigated through the complex simulation. Review your AI-powered performance report below.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl mt-8 relative z-10">
            <div className="bg-white/[0.03] border border-white/5 p-10 rounded-[32px] backdrop-blur-md">
              <div className="text-5xl font-bold text-white mb-2">{avgScore}%</div>
              <div className="text-[10px] uppercase tracking-[0.4em] text-violet-400 font-black">Overall Score</div>
            </div>
            <div className="bg-white/[0.03] border border-white/5 p-10 rounded-[32px] backdrop-blur-md">
              <div className="text-5xl font-bold text-white mb-2">{questions.length}</div>
              <div className="text-[10px] uppercase tracking-[0.4em] text-violet-400 font-black">Modules Passed</div>
            </div>
            <div className="bg-white/[0.03] border border-white/5 p-10 rounded-[32px] backdrop-blur-md">
              <div className="text-5xl font-bold text-white mb-2">{formatTime(1800 - timeLeft)}</div>
              <div className="text-[10px] uppercase tracking-[0.4em] text-violet-400 font-black">Total Runtime</div>
            </div>
          </div>

          <div className="flex gap-6 pt-12 relative z-10">
            <Link href="/dashboard" className="btn-premium-primary px-16 h-18 flex items-center gap-4 text-lg">
              <Home className="w-6 h-6" />
              BACK TO COMMAND CENTER
            </Link>
          </div>
        </div>

        <div className="space-y-10">
          <h2 className="text-3xl font-bold text-white uppercase tracking-tight flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <Sparkles className="text-violet-400 w-5 h-5" />
            </div>
            Performance Breakdown
          </h2>
          <div className="grid grid-cols-1 gap-6">
            {allFeedbacks.map((f, i) => (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                key={i} 
                className="premium-card p-10 border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-8 pb-8 border-b border-white/5">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-violet-400 uppercase tracking-[0.5em]">Question {i + 1}</span>
                    <h3 className="text-2xl font-bold text-white tracking-tight">{f.question}</h3>
                  </div>
                  <div className={`px-8 py-4 rounded-2xl font-black text-3xl border shadow-2xl ${
                    f.score > 80 ? 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5' : 
                    f.score > 50 ? 'text-amber-400 border-amber-400/20 bg-amber-400/5' : 
                    'text-red-400 border-red-400/20 bg-red-400/5'
                  }`}>
                    {f.score}
                  </div>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Transcript</label>
                    <p className="text-white/60 italic text-lg leading-relaxed">"{f.answer}"</p>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">AI Evaluation</label>
                      <p className="text-white/90 text-lg leading-relaxed font-medium">{f.aiFeedback}</p>
                    </div>
                    <div className="bg-violet-500/5 border border-violet-500/10 p-6 rounded-2xl flex items-start gap-4">
                      <Lightbulb className="w-6 h-6 text-violet-400 shrink-0 mt-1" />
                      <p className="text-violet-200/80 text-sm font-medium leading-relaxed">{f.aiTip}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col gap-10 w-full h-full">
      {/* Interaction Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 flex-grow">
        {/* Left Wing: AI Interviewer */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="premium-card flex-grow relative overflow-hidden bg-[#02040A] min-h-[500px] shadow-[0_0_100px_-20px_rgba(99,102,241,0.2)] border-white/5">
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
            <div className="absolute inset-0 bg-gradient-to-t from-[#02040A] via-transparent to-transparent opacity-60"></div>

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
            {status === 'interviewing' ? (
              <motion.div 
                key="q-area"
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
                        <span className="text-[10px] font-black text-violet-400 uppercase tracking-[0.5em]">Question {currentIndex + 1} / {questions.length}</span>
                        <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">{currentQuestion.type}</span>
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
                          <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] mb-0.5 leading-none">Session Clock</span>
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
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4">Neural Voice Architecture</span>
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
                        className="group relative flex items-center justify-between w-[280px] px-8 py-5 rounded-[24px] bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-700 hover:from-indigo-500 hover:via-violet-500 hover:to-fuchsia-600 disabled:opacity-20 disabled:grayscale transition-all duration-700 shadow-[0_30px_100px_-20px_rgba(99,102,241,0.6)] border-t border-white/30 overflow-hidden active:scale-95 text-left"
                      >
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        
                        <div className="flex flex-col items-start justify-center relative">
                          <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em] mb-1 group-hover:text-white/60 transition-colors">Neural Sync</span>
                          <span className="text-xs font-black text-white uppercase tracking-[0.4em] drop-shadow-2xl">
                            {isSubmitting ? 'ANALYZING...' : 'COMMIT RESPONSE'}
                          </span>
                        </div>
                        
                        {isSubmitting ? (
                          <div className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          <div className="relative w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors duration-700 border border-white/10">
                            <Send className="w-4 h-4 text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-700 ease-out" />
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="feedback-area"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                className="flex flex-col gap-10 h-full justify-center py-10"
              >
                <div className="premium-card p-20 border-violet-500/20 relative overflow-hidden rounded-[64px]">
                   <div className="absolute top-0 left-0 w-full h-3 primary-gradient opacity-60"></div>
                   <div className="flex flex-col gap-16 items-center text-center">
                      <div className="flex flex-col items-center gap-8">
                        <div className="w-48 h-48 rounded-[60px] primary-gradient flex flex-col items-center justify-center shadow-[0_30px_80px_-10px_rgba(99,102,241,0.6)]">
                           <span className="text-7xl font-black text-white tracking-tighter leading-none">{feedback?.score}</span>
                           <span className="text-[11px] font-black text-white/60 uppercase tracking-[0.5em] mt-3">ACCURACY</span>
                        </div>
                        <div className="flex items-center gap-4">
                           {[1,2,3,4,5].map(s => (
                             <motion.div 
                              key={s} 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: s * 0.1 }}
                              className={`w-3 h-3 rounded-full ${s <= (feedback?.score || 0)/20 ? 'bg-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.6)]' : 'bg-white/10'}`} 
                             />
                           ))}
                        </div>
                      </div>

                      <div className="space-y-12 w-full">
                         <div className="space-y-6">
                            <h3 className="text-sm font-black text-white/30 uppercase tracking-[0.6em] flex items-center justify-center gap-6">
                              <div className="w-16 h-px bg-white/5"></div>
                              INTELLIGENT EVALUATION
                              <div className="w-16 h-px bg-white/5"></div>
                            </h3>
                            <p className="text-white leading-[1.35] text-3xl font-bold px-6 tracking-tight">
                              "{feedback?.aiFeedback}"
                            </p>
                         </div>

                         <div className="p-10 rounded-[40px] bg-white/[0.02] border border-white/5 space-y-5 relative group transition-all duration-700 hover:bg-white/[0.04]">
                            <div className="absolute inset-0 bg-violet-500/[0.03] rounded-[40px] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <h4 className="text-[11px] font-black text-violet-400 uppercase tracking-[0.5em] flex items-center justify-center gap-4">
                              <Zap className="w-5 h-5 fill-violet-400" />
                              GROWTH ARCHITECTURE
                            </h4>
                            <p className="text-white/90 font-bold text-xl leading-relaxed relative z-10">
                              {feedback?.aiTip}
                            </p>
                         </div>
                      </div>

                      <button 
                        onClick={handleNext}
                        className="btn-premium-primary w-full h-24 text-2xl shadow-[0_30px_70px_-15px_rgba(99,102,241,0.5)] tracking-tight"
                      >
                        {currentIndex === questions.length - 1 ? 'CONSOLIDATE PERFORMANCE DATA' : 'INITIATE NEXT MODULE'}
                        <ChevronRight className="w-7 h-7 ml-5 group-hover:translate-x-4 transition-transform" />
                      </button>
                   </div>
                </div>
              </motion.div>
            )}
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
            <span className="text-[10px] font-black uppercase tracking-[0.6em] group-hover:text-emerald-400 transition-colors">Neural Core: Optimized</span>
          </div>
          <div className="flex items-center gap-5 text-white/10 group cursor-default">
            <span className="material-symbols-outlined text-violet-400/50 text-2xl group-hover:scale-125 transition-transform duration-500">model_training</span>
            <span className="text-[10px] font-black uppercase tracking-[0.6em] group-hover:text-white transition-colors">
              Model: {process.env.NEXT_PUBLIC_AI_MODEL || 'Gemini 1.5 Flash'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-10">
          <span className="text-[10px] font-black text-white/5 uppercase tracking-[0.5em]">Real-time Calibrations:</span>
          {['Semantics', 'Sentiment', 'Fluency'].map((area) => (
            <span key={area} className="bg-white/[0.03] text-white/20 px-10 py-4 rounded-2xl text-[9px] font-black border border-white/5 uppercase tracking-[0.4em] hover:text-white hover:border-violet-500/30 transition-all cursor-default">
              {area}
            </span>
          ))}
        </div>
      </footer>
    </div>
  );
}
