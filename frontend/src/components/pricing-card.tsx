"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { SubscriptionPlan } from "@/lib/subscription-plans";

interface PricingCardProps {
  plan: SubscriptionPlan;
  isTrialExhausted?: boolean;
}

export function PricingCard({ plan, isTrialExhausted }: PricingCardProps) {
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscription = async () => {
    // If it's a free trial or no backend mapping, use standard navigation
    if (!plan.backendPlanType) {
      window.location.href = plan.ctaHref;
      return;
    }

    try {
      setIsLoading(true);
      const token = await getToken();

      if (!token) {
        window.location.href = "/sign-in?redirect_url=" + window.location.href;
        return;
      }

      const planName = plan.backendPlanType === "pro_annual" ? "yearly" : "monthly";

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/billing/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          planName: planName,
          successUrl: `${window.location.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/pricing`,
        }),
      });

      const data = await response.json();

      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Failed to create checkout session");
      }
    } catch (error) {
      console.error("❌ Subscription Error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <article className={`pricing-card glass fade-up visible ${plan.popular ? "popular" : ""}`}>
      {plan.popular && <span className="popular-badge">MOST POPULAR</span>}
      <h3>{plan.name}</h3>
      <p className="text-muted">{plan.subtitle}</p>
      {plan.id === "free-trial" && isTrialExhausted && (
        <p className="text-rose-400 text-xs font-medium mt-1">
          Trial ended. Upgrade to continue.
        </p>
      )}
      <div className="price">
        {plan.price}
        <span>{plan.cadence}</span>
      </div>
      <ul className="pricing-features flex-1">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <Check size={18} className="shrink-0 text-indigo-400 mt-1" />
            <span className="text-sm text-slate-300">{feature}</span>
          </li>
        ))}
      </ul>
      <button
        onClick={handleSubscription}
        disabled={isLoading || (plan.id === "free-trial" && isTrialExhausted)}
        className={`btn ${plan.popular ? "btn-primary" : "btn-secondary"}`}
        style={{ 
          width: "100%", 
          justifyContent: "center", 
          cursor: (isLoading || (plan.id === "free-trial" && isTrialExhausted)) ? "not-allowed" : "pointer" 
        }}
      >
        {isLoading ? (
          <Loader2 className="animate-spin" size={18} />
        ) : (plan.id === "free-trial" && isTrialExhausted) ? (
          "Limit Reached"
        ) : (
          plan.ctaLabel
        )}
      </button>
    </article>
  );
}
