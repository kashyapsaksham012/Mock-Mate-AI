"use client";

import { motion } from "framer-motion";

export function CheckIcon() {
  return (
    <div className="circle-wrap" style={{
      width: '96px',
      height: '96px',
      margin: '0 auto 1.5rem',
      position: 'relative'
    }}>
      {/* Circle bg — spring pop */}
      <motion.div
        className="circle-bg"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: '#d1fae5'
        }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 18, delay: 0.2 }}
      />

      {/* SVG ring + check */}
      <svg
        className="ring-svg"
        viewBox="0 0 96 96"
        fill="none"
        style={{
          position: 'absolute',
          inset: 0,
          width: '96px',
          height: '96px'
        }}
      >
        {/* Outer ring draws itself */}
        <motion.circle
          cx="48"
          cy="48"
          r="45"
          stroke="#10b981"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.6 }}
        />
        {/* Checkmark strokes in */}
        <motion.path
          d="M28 48 L41 61 L68 34"
          stroke="#059669"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 1.1 }}
        />
      </svg>
    </div>
  );
}
