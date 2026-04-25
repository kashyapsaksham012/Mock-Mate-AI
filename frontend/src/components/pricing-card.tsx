"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { SubscriptionPlan } from "@/lib/subscription-plans";

interface PricingCardProps {
  plan: SubscriptionPlan;
}

export function PricingCard({ plan }: PricingCardProps) {
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

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/payment/create-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          planType: plan.backendPlanType,
        }),
      });

      const data = await response.json();

      if (data.success && data.data.url) {
        window.location.href = data.data.url;
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
      <div className="price">
        {plan.price}
        <span>{plan.cadence}</span>
      </div>
      <ul className="pricing-features">
        {plan.features.map((feature) => (
          <li key={feature}>
            <Check size={18} />
            {feature}
          </li>
        ))}
      </ul>
      <button
        onClick={handleSubscription}
        disabled={isLoading}
        className={`btn ${plan.popular ? "btn-primary" : "btn-secondary"}`}
        style={{ width: "100%", justifyContent: "center", cursor: "pointer" }}
      >
        {isLoading ? <Loader2 className="animate-spin" size={18} /> : plan.ctaLabel}
      </button>
    </article>
  );
}
