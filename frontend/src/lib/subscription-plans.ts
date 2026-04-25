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
    ctaHref: appRoutes.dashboardNew,
  },
  {
    id: "monthly",
    name: "Monthly",
    subtitle: "For consistent interview prep",
    price: "$19",
    cadence: "/month",
    features: ["Unlimited interviews", "Voice mode", "Detailed score breakdown", "Priority support"],
    ctaLabel: "Upgrade to Monthly",
    ctaHref: appRoutes.dashboardNew,
    popular: true,
  },
  {
    id: "team-monthly",
    name: "Team Monthly",
    subtitle: "Built for teams and cohorts",
    price: "$49",
    cadence: "/month",
    features: ["Everything in Monthly", "Team dashboard", "Usage insights", "Role-based access"],
    ctaLabel: "Start Team Plan",
    ctaHref: appRoutes.dashboardNew,
  },
] as const;

