"use client";

import { SignUp } from "@clerk/nextjs";
import { AuthShell, clerkAppearance } from "@/components/auth/auth-shell";
import { postAuthRedirectUrl } from "@/lib/clerk-routes";

export default function SignUpPage() {
  return (
    <AuthShell>
      <SignUp
        appearance={clerkAppearance}
        forceRedirectUrl={postAuthRedirectUrl}
        fallbackRedirectUrl={postAuthRedirectUrl}
      />
    </AuthShell>
  );
}
