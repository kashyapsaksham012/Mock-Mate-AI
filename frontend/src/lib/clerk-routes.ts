import { appRoutes } from "@/lib/app-routes";

export const clerkRoutes = {
  signIn: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? appRoutes.signIn,
  signUp: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL ?? appRoutes.signUp,
  afterSignIn: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL,
  afterSignUp: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL,
};

export const postAuthRedirectUrl = clerkRoutes.afterSignIn ?? clerkRoutes.afterSignUp ?? appRoutes.pricing;
