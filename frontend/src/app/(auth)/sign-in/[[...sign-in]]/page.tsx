"use client";

import { SignIn } from "@clerk/nextjs";
import { AuthShell, clerkAppearance } from "@/components/auth/auth-shell";
import { postAuthRedirectUrl } from "@/lib/clerk-routes";

export default function SignInPage() {
  return (
    <AuthShell>
      <SignIn
        appearance={clerkAppearance}
        forceRedirectUrl={postAuthRedirectUrl}
        fallbackRedirectUrl={postAuthRedirectUrl}
      />
    </AuthShell>
  );
}
