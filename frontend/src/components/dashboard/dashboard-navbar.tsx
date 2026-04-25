"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowLeft, LogOut } from "lucide-react";
import { SignOutButton, UserButton } from "@clerk/nextjs";
import { appRoutes } from "@/lib/app-routes";

const navigationLinks = [
  { label: "Features", href: "/#features" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Testimonials", href: "/#testimonials" },
];

export function DashboardNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`navbar ${isScrolled ? "scrolled" : ""}`}>
      <div className="container nav-container">
        <Link href={appRoutes.home} className="logo font-heading">
          <Sparkles size={24} />
          MockMate
        </Link>
        
        <nav className="nav-links">
          {navigationLinks.map((link, idx) => (
            <Link key={idx} href={link.href} className="nav-link">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="nav-actions">
          <Link
            href={appRoutes.home}
            className="btn btn-ghost"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Back to home</span>
          </Link>
          
          <SignOutButton redirectUrl={appRoutes.home}>
            <button className="btn btn-secondary" type="button">
              <LogOut size={16} className="sm:hidden" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </SignOutButton>

          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-9 h-9 ring-2 ring-indigo-500/50",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}
