"use client";

import { motion } from "framer-motion";

const headerContent = {
  badge: "Session Setup",
  title: {
    main: "Prepare for your",
    highlight: "Dream Role"
  },
  description: "Configure your personalized mock interview. Our AI will analyze your background and the target role to generate a custom-tailored experience."
};

export function InterviewSetupHeader() {
  return (
    <div className="flex flex-col items-center justify-center text-center w-full max-w-[800px] mx-auto mb-[60px]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="inline-flex items-center px-4 py-1.5 rounded-full bg-accent-primary/10 border border-accent-primary/20 text-accent-primary text-[10px] font-bold tracking-[0.2em] uppercase mb-8"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-accent-primary mr-2.5 shadow-[0_0_8px_var(--accent-primary)]" />
        {headerContent.badge}
      </motion.div>
      
      <motion.h1 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
        className="text-4xl md:text-6xl font-heading mb-8 leading-[1.1] tracking-tight w-full flex flex-col items-center"
      >
        <span>{headerContent.title.main}</span>
        <span className="text-gradient">{headerContent.title.highlight}</span>
      </motion.h1>
      
      <motion.p 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
        className="text-text-muted text-lg md:text-xl leading-relaxed font-medium w-full text-center"
      >
        {headerContent.description}
      </motion.p>
    </div>
  );
}
