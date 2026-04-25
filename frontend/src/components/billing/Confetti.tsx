"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

const COLORS = ["#10b981", "#34d399", "#6ee7b7", "#fbbf24", "#60a5fa", "#f472b6", "#a78bfa"];

export function Confetti() {
  const dots = useMemo(
    () =>
      Array.from({ length: 38 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        size: Math.random() * 8 + 5,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        delay: Math.random() * 0.8 + 1.0,
        duration: Math.random() * 1.5 + 1.2,
        isSquare: Math.random() > 0.5,
      })),
    []
  );

  return (
    <div
      className="confetti-wrap"
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden'
      }}
    >
      {dots.map((d) => (
        <motion.span
          key={d.id}
          style={{
            position: "absolute",
            left: `${d.x}%`,
            top: "-5%",
            width: d.size,
            height: d.size,
            background: d.color,
            borderRadius: d.isSquare ? "3px" : "50%",
            zIndex: 50
          }}
          initial={{ y: 0, opacity: 1, rotate: 0 }}
          animate={{ y: 800, opacity: 0, rotate: 720 }}
          transition={{ duration: d.duration, delay: d.delay, ease: "linear" }}
        />
      ))}
    </div>
  );
}
