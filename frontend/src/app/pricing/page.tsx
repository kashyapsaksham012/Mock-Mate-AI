import Link from "next/link";
import { Check } from "lucide-react";
import { auth, currentUser } from "@clerk/nextjs/server";
import { PricingNavbar } from "@/components/pricing-navbar";

const pricingPlans = [
  {
    name: "Free",
    subtitle: "Best for getting started",
    price: "$0",
    cadence: "/mo",
    features: ["3 interviews per month", "Basic feedback", "Community access"],
    ctaLabel: "Start Free",
    popular: false,
  },
  {
    name: "Pro",
    subtitle: "Built for serious prep",
    price: "$19",
    cadence: "/mo",
    features: ["Unlimited interviews", "Voice mode", "Resume upload", "Full analytics"],
    ctaLabel: "Go Pro",
    popular: true,
  },
  {
    name: "Team",
    subtitle: "Train together at scale",
    price: "$49",
    cadence: "/mo",
    features: ["Everything in Pro", "Team dashboard", "Bulk reports", "Custom roles"],
    ctaLabel: "Contact Sales",
    popular: false,
  },
] as const;

export default async function PricingPage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#080C14] px-6 pb-20 text-white">
      <PricingNavbar />

      <section className="mx-auto max-w-6xl pt-32 pb-14 text-center">
        <p className="mb-3 text-sm font-medium text-indigo-400">
          Welcome back, {user?.firstName ?? "there"} 👋
        </p>
        <h1 className="mb-4 text-5xl font-bold tracking-tight">Choose Your Plan</h1>
        <p className="text-lg text-slate-400">Start free. Upgrade when you&apos;re ready.</p>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-6 md:grid-cols-3">
        {pricingPlans.map((plan) => (
          <article
            key={plan.name}
            className={`rounded-3xl border p-8 backdrop-blur-xl transition-all ${
              plan.popular
                ? "scale-[1.02] border-indigo-500 bg-gradient-to-br from-indigo-500/15 to-violet-500/10 shadow-2xl shadow-indigo-500/20"
                : "border-white/10 bg-slate-900/60"
            }`}
          >
            {plan.popular && (
              <span className="mb-4 inline-flex rounded-full bg-indigo-500 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
                Most Popular
              </span>
            )}
            <h2 className="text-2xl font-semibold">{plan.name}</h2>
            <p className="mt-2 text-sm text-slate-400">{plan.subtitle}</p>
            <p className="mt-6 text-5xl font-bold">
              {plan.price}
              <span className="ml-1 text-base font-medium text-slate-400">{plan.cadence}</span>
            </p>
            <ul className="mt-8 space-y-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-slate-200">
                  <Check size={18} className="mt-0.5 text-emerald-400" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/dashboard/new"
              className={`mt-8 inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                plan.popular
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-500 hover:to-violet-500"
                  : "border border-white/15 bg-white/5 text-white hover:bg-white/10"
              }`}
            >
              {plan.ctaLabel}
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}
