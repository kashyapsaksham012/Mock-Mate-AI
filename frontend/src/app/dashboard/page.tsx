"use client";

import { SuccessOverlay } from "@/components/billing/SuccessOverlay";
import { PricingNavbar } from "@/components/pricing-navbar";
import { useSubscriptionStatus } from "@/hooks/use-subscription-status";
import { appRoutes } from "@/lib/app-routes";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data, status, isLoading, error } = useSubscriptionStatus();
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (!sessionId && !isLoading && !error && status !== "active") {
      router.replace(appRoutes.pricing);
    }
  }, [error, isLoading, router, sessionId, status]);

  return (
    <main className="landing-wrapper min-h-screen">
      <div className="bg-mesh"></div>
      <div className="bg-grid"></div>
      <div className="bg-noise"></div>
      <PricingNavbar />
      
      <SuccessOverlay />

      <section className="container" style={{ paddingTop: '120px' }}>
        <div className="fade-up visible header-content">
          <h1 className="font-size-fluid">User Dashboard</h1>
          {isLoading ? (
            <p className="text-muted mt-2">Loading subscription status...</p>
          ) : error ? (
            <p className="text-muted mt-2">Subscription status could not be loaded.</p>
          ) : data?.subscription ? (
            <div className="text-muted mt-2">
              <p>Plan: {data.subscription.planName ?? "Unknown"}</p>
              <p>
                {data.subscription.cancelAtPeriodEnd
                  ? `Cancels on ${new Date(data.subscription.periodEnd).toLocaleDateString()}`
                  : `Renews on ${new Date(data.subscription.periodEnd).toLocaleDateString()}`}
              </p>
            </div>
          ) : (
            <p className="text-muted mt-2">No active subscription found. Upgrade to unlock the dashboard.</p>
          )}
        </div>
        
        <div className="glass" style={{ height: '400px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2rem' }}>
          <p className="text-muted">Dashboard content coming soon...</p>
        </div>
      </section>
    </main>
  );
}
