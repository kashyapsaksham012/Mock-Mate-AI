"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

const COLORS = ["#10b981", "#34d399", "#6ee7b7", "#fbbf24", "#60a5fa", "#f472b6", "#a78bfa"];

function createSeededRandom(seed: number) {
  let state = seed;

  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

export function Confetti() {
  const dots = useMemo(
    () =>
      Array.from({ length: 38 }, (_, i) => {
        const random = createSeededRandom(i + 1);

        return {
          id: i,
          x: random() * 100,
          size: random() * 8 + 5,
          color: COLORS[Math.floor(random() * COLORS.length)],
          delay: random() * 0.8 + 1.0,
          duration: random() * 1.5 + 1.2,
          isSquare: random() > 0.5,
        };
      }),
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
