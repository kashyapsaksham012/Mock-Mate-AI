"use client";

import { useSubscriptionStatus } from "@/hooks/use-subscription-status";
import { Sparkles } from "lucide-react";

export function PlanBadge() {
  const { data, status, isLoading } = useSubscriptionStatus();

  if (isLoading || status !== "active" || !data?.subscription?.planName) {
    return null;
  }

  return (
    <div className="plan-badge">
      <Sparkles size={12} className="text-indigo-400" />
      <span>{data.subscription.planName} Plan</span>
    </div>
  );
}
