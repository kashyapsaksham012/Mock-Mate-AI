"use client";

import Link from "next/link";
import { Sparkles, ArrowLeft } from "lucide-react";
import { SignOutButton, UserButton } from "@clerk/nextjs";

export function PricingNavbar() {
  return (
    <nav className="fixed top-0 left-0 z-50 w-full border-b border-white/10 bg-[#080C14]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-white">
          <Sparkles size={20} className="text-cyan-400" />
          MockMate
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-300 transition-colors hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to home
          </Link>
          <SignOutButton redirectUrl="/">
            <button className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-slate-200 transition-colors hover:bg-white/10">
              Sign out
            </button>
          </SignOutButton>
          <UserButton />
        </div>
      </div>
    </nav>
  );
}
