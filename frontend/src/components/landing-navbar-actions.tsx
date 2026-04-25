"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { UserButton, useAuth } from "@clerk/nextjs";
import { clerkRoutes, postAuthRedirectUrl } from "@/lib/clerk-routes";
import { useSubscriptionStatus } from "@/hooks/use-subscription-status";
import { Sparkles } from "lucide-react";

export function LandingNavbarActions() {
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const { isSignedIn } = useAuth();
  const { data, status } = useSubscriptionStatus();
  
  const signInUrl = clerkRoutes.signIn;
  const signUpUrl = clerkRoutes.signUp;

  if (!isHydrated) {
    return <div className="nav-actions" aria-hidden="true" />;
  }

  return (
    <div className="nav-actions">
      {!isSignedIn ? (
        <>
          {signInUrl ? (
            <Link href={signInUrl} className="btn btn-ghost">
              Sign In
            </Link>
          ) : null}
          {signUpUrl ? (
            <Link href={signUpUrl} className="btn btn-primary">
              Start Free
            </Link>
          ) : null}
        </>
      ) : (
        <>
          <Link href={postAuthRedirectUrl} className="btn btn-ghost">
            Dashboard
          </Link>
          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-9 h-9 ring-2 ring-indigo-500/50",
              },
            }}
          />
        </>
      )}
    </div>
  );
}
