import { auth, currentUser } from "@clerk/nextjs/server";
import { PricingNavbar } from "@/components/pricing-navbar";
import { PricingCard } from "@/components/pricing-card";
import { subscriptionPageCopy, subscriptionPlans } from "@/lib/subscription-plans";
import { redirect } from "next/navigation";
import { appRoutes } from "@/lib/app-routes";

type BackendPlan = {
  name: string;
  priceCents: number;
};

async function getBackendPlans() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/billing/plans`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.error("Failed to fetch backend plans:", err);
    return [];
  }
}

export default async function PricingPage() {
  const { userId, getToken } = await auth();
  
  let shouldRedirect = false;

  let isTrialExhausted = false;
  let currentTrialUsage = 0;

  // If logged in, check if already subscribed or trial exhausted
  if (userId) {
    try {
      const token = await getToken();
      const statusRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/billing/subscription-status`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      });
      if (statusRes.ok) {
        const statusJson = await statusRes.json();
        if (statusJson.status === 'active') {
          shouldRedirect = true;
        }
        
        currentTrialUsage = statusJson.trialUsage || 0;
        if (statusJson.trialUsage >= (statusJson.trialLimit || 3)) {
          isTrialExhausted = true;
        }
      }
    } catch (err) {
      console.error("Failed to check subscription status in PricingPage:", err);
    }
  }

  if (shouldRedirect) {
    redirect(appRoutes.dashboard);
  }

  const [user, backendPlans] = await Promise.all([
    currentUser(),
    getBackendPlans()
  ]);

  // Merge backend data with frontend static metadata
  const dynamicPlans = subscriptionPlans.map(plan => {
    if (!plan.backendPlanType) return plan;
    
    const backendPlan = backendPlans.find((planRecord: BackendPlan) => 
      planRecord.name === (plan.backendPlanType === "pro_annual" ? "yearly" : "monthly")
    );

    if (backendPlan) {
      return {
        ...plan,
        price: `$${backendPlan.priceCents / 100}`,
      };
    }
    return plan;
  });

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
          {dynamicPlans.map((plan) => (
            <PricingCard 
              key={plan.id} 
              plan={plan} 
              isTrialExhausted={isTrialExhausted}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
