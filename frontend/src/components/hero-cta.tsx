"use client";

import { useSyncExternalStore } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { clerkRoutes, postAuthRedirectUrl } from "@/lib/clerk-routes";
import { useSubscriptionStatus } from "@/hooks/use-subscription-status";

type HeroCTAProps = {
  className?: string;
};

export function HeroCTA({ className = "" }: HeroCTAProps) {
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const { isSignedIn } = useAuth();
  const { status } = useSubscriptionStatus();
  const router = useRouter();
  const signUpUrl = clerkRoutes.signUp;

  const handleClick = () => {
    if (!isHydrated) {
      return;
    }
    if (isSignedIn) {
      router.push(postAuthRedirectUrl);
      return;
    }
    if (signUpUrl) {
      router.push(signUpUrl);
    }
  };

  const buttonText = status === 'active' 
    ? "Go to Dashboard" 
    : isSignedIn 
      ? "Resume Your Interview" 
      : "Start Your Free Interview";

  return (
    <button onClick={handleClick} className={`btn btn-primary ${className}`.trim()} type="button" disabled={!isHydrated}>
      {buttonText}
      <span aria-hidden="true">→</span>
    </button>
  );
}
