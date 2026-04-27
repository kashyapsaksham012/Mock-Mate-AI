"use client";

import { useAuth } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, CheckCircle2, Trash2, Zap } from "lucide-react";
import { useState, type ChangeEvent } from "react";
import { toast } from "react-toastify";
import { uploadResume } from "@/lib/resume-autofill";
import { type ResumeAutofillData } from "@/types/resume";

const config = {
  title: "Import your background",
  description: "Upload your resume to extract structured profile data and pre-fill the form.",
  formats: "PDF or DOCX up to 5MB",
  analyzingText: "Analyzing your career path...",
  successTag: "VERIFIED",
};

type ResumeUploadSectionProps = {
  onResumeParsed: (data: ResumeAutofillData) => void;
  onResumeCleared: () => void;
};

export function ResumeUploadSection({ onResumeParsed, onResumeCleared }: ResumeUploadSectionProps) {
  const { getToken } = useAuth();
  const [file, setFile] = useState<{ name: string; size: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) {
      return;
    }

    const input = e.currentTarget;
    setError(null);

    // Enforce 5MB limit
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5MB limit. Please upload a smaller file.");
      input.value = '';
      return;
    }

    setIsUploading(true);

    try {
      const token = await getToken();
      const result = await uploadResume(selectedFile, token);

      setFile({
        name: selectedFile.name,
        size: (selectedFile.size / (1024 * 1024)).toFixed(1) + ' MB',
      });
      onResumeParsed(result.data);
      toast.success("Resume Intelligence Synchronized", {
        style: { borderRadius: '16px' }
      });
    } catch (uploadError: any) {
      setFile(null);
      const msg = uploadError instanceof Error ? uploadError.message : 'Resume upload failed';
      setError(msg);
      toast.error(msg, {
        style: { borderRadius: '16px' }
      });
    } finally {
      setIsUploading(false);
      input.value = '';
    }
  };

  const handleRemove = () => {
    setFile(null);
    setError(null);
    onResumeCleared();
    toast.info("Resume Data Cleared", {
      style: { borderRadius: '16px' }
    });
  };

  return (
    <div className="w-full">
      <div className={`premium-card p-2 relative group cursor-pointer ${file ? 'border-accent-primary/40' : ''}`}>
        <input
          type="file"
          className="absolute inset-0 opacity-0 cursor-pointer z-10"
          onChange={handleFileChange}
          accept=".pdf,.docx"
          disabled={!!file || isUploading}
        />

        <div className={`rounded-[20px] border-2 border-dashed transition-all duration-500 ${
          file ? 'border-accent-primary/20 bg-accent-primary/5' : 'border-white/5 bg-white/[0.02] group-hover:border-accent-primary/30 group-hover:bg-accent-primary/[0.02]'
        }`}>
          <div className="p-10 md:p-14 flex flex-col items-center text-center">
            <AnimatePresence mode="wait">
              {!file && !isUploading ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-primary to-accent-secondary p-[1px] mb-6 relative">
                    <div className="w-full h-full rounded-2xl bg-[#080C14] flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-accent-primary/10 animate-pulse" />
                      <Upload className="w-8 h-8 text-white relative z-10" />
                    </div>
                  </div>

                  <h3 className="text-xl font-bold mb-2 tracking-tight uppercase font-heading" style={{ fontSize: '1.25rem', letterSpacing: '0.02em' }}>{config.title}</h3>
                  <p className="text-text-muted text-base max-w-sm mb-6 font-medium">{config.description}</p>

                  <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[11px] font-bold text-text-muted uppercase tracking-widest">
                    <Zap size={14} className="text-accent-highlight" />
                    {config.formats}
                  </div>
                </motion.div>
              ) : isUploading ? (
                <motion.div
                  key="uploading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center py-2"
                >
                  <div className="relative w-20 h-20 mb-6">
                    <svg className="w-full h-full rotate-[-90deg]">
                      <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/5" />
                      <motion.circle
                        cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="4" fill="transparent"
                        strokeDasharray="226"
                        initial={{ strokeDashoffset: 226 }}
                        animate={{ strokeDashoffset: 0 }}
                        transition={{ duration: 2.5, ease: 'easeInOut' }}
                        className="text-accent-primary"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FileText className="w-7 h-7 text-accent-primary animate-pulse" />
                    </div>
                  </div>
                  <p className="text-lg font-bold text-accent-primary animate-pulse tracking-widest uppercase">{config.analyzingText}</p>
                </motion.div>
              ) : (
                <motion.div
                  key="complete"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full flex flex-col md:flex-row items-center justify-center gap-8 text-left"
                >
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center relative z-10">
                      <FileText className="w-10 h-10 text-accent-primary" />
                    </div>
                    <div className="absolute -bottom-1.5 -right-1.5 bg-success-green p-1.5 rounded-full z-20 shadow-lg">
                      <CheckCircle2 size={14} className="text-white" />
                    </div>
                  </div>

                  <div className="text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
                      <span className="text-2xl font-bold tracking-tight">{file?.name}</span>
                      <span className="px-2 py-0.5 rounded-md bg-accent-primary/20 text-accent-primary text-[10px] font-black tracking-widest uppercase">
                        {config.successTag}
                      </span>
                    </div>
                    <div className="flex items-center justify-center md:justify-start gap-5 text-text-muted">
                      <span className="text-base font-medium">{file?.size}</span>
                      <div className="w-1 h-1 rounded-full bg-white/20" />
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemove(); }}
                        className="flex items-center gap-2 text-sm font-bold text-red-400/70 hover:text-red-400 transition-colors group/del"
                      >
                        <Trash2 size={14} className="group-hover/del:scale-110 transition-transform" />
                        Remove document
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {error ? <p className="mt-6 text-sm text-red-400">{error}</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
