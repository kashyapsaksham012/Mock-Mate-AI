import Link from "next/link";
import { Check } from "lucide-react";
import { auth, currentUser } from "@clerk/nextjs/server";
import { PricingNavbar } from "@/components/pricing-navbar";
import { subscriptionPageCopy, subscriptionPlans } from "@/lib/subscription-plans";

export default async function PricingPage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId) {
    return null;
  }

  return (
    <main className="landing-wrapper min-h-screen">
      <div className="bg-mesh"></div>
      <div className="bg-grid"></div>
      <div className="bg-noise"></div>
      <PricingNavbar />

      <section className="container pricing-section">
        {/* TEXT BLOCK */}
        <div className="fade-up visible header-content text-center">
          <p className="mb-3 text-sm font-medium text-indigo-400">
            Welcome back, {user?.firstName ?? "there"} 👋
          </p>

          <h1 className="font-size-fluid">
            {subscriptionPageCopy.title}
          </h1>

          <p className="text-muted mt-2 text-center">
            {subscriptionPageCopy.description}
          </p>
        </div>

        <div className="pricing-grid">
          {subscriptionPlans.map((plan) => (
            <article key={plan.id} className={`pricing-card glass fade-up visible ${plan.popular ? "popular" : ""}`}>
              {plan.popular && <span className="popular-badge">{subscriptionPageCopy.popularBadge}</span>}
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
              <Link
                href={plan.ctaHref}
                className={`btn ${plan.popular ? "btn-primary" : "btn-secondary"}`}
                style={{ width: "100%", justifyContent: "center" }}
              >
                {plan.ctaLabel}
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
