"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { LandingNavbarActions } from "@/components/landing-navbar-actions";
import { PlanBadge } from "@/components/plan-badge";
import Link from "next/link";

interface GlobalNavbarProps {
  isScrolled?: boolean;
  links?: { label: string; href: string }[];
  showActions?: boolean;
  className?: string;
}

export function GlobalNavbar({ 
  isScrolled: initialScrolled = false, 
  links = [
    { label: "Features", href: "/#features" },
    { label: "How It Works", href: "/#how-it-works" },
    { label: "Pricing", href: "/#pricing" },
    { label: "Testimonials", href: "/#testimonials" },
  ],
  showActions = true,
  className = ""
}: GlobalNavbarProps) {
  const [isScrolled, setIsScrolled] = useState(initialScrolled);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`navbar ${isScrolled ? "scrolled" : ""} !z-[1000] ${className}`}>
      <div className="container nav-container !max-w-full !px-8">
        <Link href="/" className="logo font-heading flex items-center gap-3 no-underline">
          <Sparkles size={24} className="text-cyan-400" />
          <span className="text-white font-bold tracking-tight">MockMate</span>
        </Link>
        
        <nav className="nav-links hidden lg:flex items-center gap-8">
          {links.map((link, idx) => (
            <Link key={idx} href={link.href} className="nav-link text-sm font-semibold text-white/60 hover:text-white transition-colors no-underline">
              {link.label}
            </Link>
          ))}
          <PlanBadge />
        </nav>

        {showActions && <LandingNavbarActions />}
      </div>
    </header>
  );
}
