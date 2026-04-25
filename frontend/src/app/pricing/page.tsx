import { currentUser } from "@clerk/nextjs/server";
import { PricingNavbar } from "@/components/pricing-navbar";
import { PricingCard } from "@/components/pricing-card";
import { subscriptionPageCopy, subscriptionPlans } from "@/lib/subscription-plans";

export default async function PricingPage() {
  const user = await currentUser();

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
            <PricingCard key={plan.id} plan={plan} />
          ))}
        </div>
      </section>
    </main>
  );
}
