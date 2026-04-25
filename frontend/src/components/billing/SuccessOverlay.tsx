"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@clerk/nextjs";
import { CheckIcon } from "./CheckIcon";
import { Confetti } from "./Confetti";

interface SessionData {
  verified: boolean;
  planName: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  amount: number | null;
  currency: string | null;
  sessionId: string;
  status: string;
}

export function SuccessOverlay() {
  const { getToken } = useAuth();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [data, setData] = useState<SessionData | null>(null);
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!sessionId) return;

    (async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/billing/verify-session?session_id=${sessionId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!res.ok) {
          const errText = await res.text();
          console.error("Verification failed with status:", res.status, errText);
          throw new Error(`Status ${res.status}`);
        }
        
        const json: SessionData = await res.json();
        setData(json);
        setVisible(true);
      } catch (err) {
        console.error("Verification error:", err);
        setError(true);
      }
    })();
  }, [sessionId, getToken]);

  const handleDashboard = useCallback(() => {
    setVisible(false);
    // Clean URL without reload after animation exits
    setTimeout(() => {
      const url = new URL(window.location.href);
      url.searchParams.delete('session_id');
      window.history.replaceState({}, '', url.toString());
    }, 400);
  }, []);

  if (!sessionId || error) return null;

  return (
    <AnimatePresence>
      {visible && data && (
        <motion.div
          className="success-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.3 } }}
        >
          <Confetti />

          <motion.div
            className="success-card glass"
            initial={{ scale: 0.85, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 12 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
          >
            {/* Top accent bar */}
            <div className="accent-bar" />

            {/* Animated checkmark icon */}
            <CheckIcon />

            {/* Staggered text content */}
            <motion.div
              variants={{ show: { transition: { staggerChildren: 0.1, delayChildren: 1.3 } } }}
              initial="hidden"
              animate="show"
            >
              <FadeUp>
                <h1 className="s-title">Payment successful!</h1>
              </FadeUp>
              <FadeUp>
                <p className="s-sub">Your subscription is now active.</p>
              </FadeUp>

              <FadeUp>
                <div className="plan-badge">
                  <span className="pulse-dot" />
                  {data.planName ?? "Subscription active"}
                </div>
              </FadeUp>

              <FadeUp>
                <div className="info-box">
                  <InfoRow label="Plan" value={data.planName ?? "Unknown"} />
                  <InfoRow label="Amount charged" value={data.amount ? `$${(data.amount / 100).toFixed(2)}` : "N/A"} />
                  <InfoRow label="Next renewal" value={data.currentPeriodEnd ? new Date(data.currentPeriodEnd).toLocaleDateString() : "N/A"} />
                  <InfoRow label="Session ID" value={data.sessionId} mono />
                </div>
              </FadeUp>

              <FadeUp>
                <button className="btn btn-primary" style={{ width: '100%', marginBottom: '0.75rem' }} onClick={handleDashboard}>
                  Go to Dashboard
                </button>
              </FadeUp>

              <FadeUp>
                <button className="btn btn-secondary" style={{ width: '100%' }}>
                  Download receipt
                </button>
              </FadeUp>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function FadeUp({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 12 },
        show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
      }}
    >
      {children}
    </motion.div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="info-row" style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '8px 0',
      borderTop: '0.5px solid rgba(255, 255, 255, 0.1)'
    }}>
      <span className="info-label" style={{ fontSize: '12px', opacity: 0.6 }}>{label}</span>
      <span className={`info-value ${mono ? "mono" : ""}`} style={{
        fontSize: '13px',
        fontWeight: 600,
        fontFamily: mono ? 'monospace' : 'inherit'
      }}>{value}</span>
    </div>
  );
}
