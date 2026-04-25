"use client";

import { useSyncExternalStore } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { clerkRoutes, postAuthRedirectUrl } from "@/lib/clerk-routes";

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

  return (
    <button onClick={handleClick} className={`btn btn-primary ${className}`.trim()} type="button" disabled={!isHydrated}>
      Start Your Free Interview
      <span aria-hidden="true">→</span>
    </button>
  );
}
