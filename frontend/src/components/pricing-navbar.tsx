"use client";

import Link from "next/link";
import { Sparkles, ArrowLeft } from "lucide-react";
import { SignOutButton, UserButton } from "@clerk/nextjs";
import { appRoutes } from "@/lib/app-routes";

export function PricingNavbar() {
  return (
    <nav className="navbar scrolled">
      <div className="container nav-container">
        <Link href={appRoutes.home} className="logo font-heading">
          <Sparkles size={20} className="text-cyan-400" />
          MockMate
        </Link>
        <div className="nav-actions">
          <Link
            href={appRoutes.home}
            className="btn btn-ghost"
            style={{ padding: "0.5rem 1rem" }}
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Back to home</span>
          </Link>
          <SignOutButton redirectUrl={appRoutes.home}>
            <button className="btn btn-secondary" type="button" style={{ padding: "0.5rem 1rem" }}>
              <span className="hidden sm:inline">Sign out</span>
              <span className="sm:hidden">Exit</span>
            </button>
          </SignOutButton>
          <UserButton />
        </div>
      </div>
    </nav>
  );
}
