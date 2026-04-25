import { appRoutes } from "@/lib/app-routes";

export type SubscriptionPlan = {
  id: string;
  name: string;
  subtitle: string;
  price: string;
  cadence: string;
  features: ReadonlyArray<string>;
  ctaLabel: string;
  ctaHref: string;
  backendPlanType?: "pro_monthly" | "pro_annual";
  popular?: boolean;
};

export const subscriptionPageCopy = {
  title: "Choose Your Plan",
  description: "Start with a free trial, then upgrade when you're ready.",
  popularBadge: "MOST POPULAR",
} as const;

export const subscriptionPlans: ReadonlyArray<SubscriptionPlan> = [
  {
    id: "free-trial",
    name: "Free Trial",
    subtitle: "Perfect to get started",
    price: "$0",
    cadence: "/3 interviews",
    features: ["3 interview trials", "Basic AI feedback", "Community support"],
    ctaLabel: "Start Free Trial",
    ctaHref: appRoutes.dashboard,
  },
  {
    id: "monthly",
    name: "Monthly",
    subtitle: "For consistent interview prep",
    price: "$19",
    cadence: "/month",
    features: ["Unlimited interviews", "Voice mode", "Detailed score breakdown", "Priority support"],
    ctaLabel: "Upgrade to Monthly",
    ctaHref: appRoutes.dashboard,
    backendPlanType: "pro_monthly",
    popular: true,
  },
  {
    id: "yearly",
    name: "Yearly",
    subtitle: "For consistent interview prep",
    price: "$49",
    cadence: "/yearly",
    features: [
      "Everything in Monthly",
      "Team dashboard",
      "Usage insights",
      "Role-based access",
    ],
    ctaLabel: "Start Yearly Plan",
    ctaHref: appRoutes.dashboard,
    backendPlanType: "pro_annual",
  },
] as const;

