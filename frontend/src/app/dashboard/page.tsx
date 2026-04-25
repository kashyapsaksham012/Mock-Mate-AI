"use client";

import { SuccessOverlay } from "@/components/billing/SuccessOverlay";
import { PricingNavbar } from "@/components/pricing-navbar";

export default function DashboardPage() {
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
          <p className="text-muted mt-2">
            Welcome to your pro dashboard. Start by creating a new mock interview.
          </p>
        </div>
        
        {/* Placeholder for dashboard content */}
        <div className="glass" style={{ 
          height: '400px', 
          borderRadius: '24px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          marginTop: '2rem'
        }}>
          <p className="text-muted">Dashboard content coming soon...</p>
        </div>
      </section>
    </main>
  );
}
