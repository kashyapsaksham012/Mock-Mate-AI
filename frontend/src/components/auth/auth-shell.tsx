import type { ReactNode } from "react";

export const clerkAppearance = {
  variables: {
    colorPrimary: "#6366F1",
    colorBackground: "#0F172A",
    colorInputBackground: "#1E293B",
    colorInputText: "#0F172A",
    colorText: "#FFFFFF",
    colorTextSecondary: "#CBD5E1",
    colorNeutral: "#334155",
    borderRadius: "12px",
    fontFamily: "inherit",
  },
  elements: {
    rootBox: "clerk-auth-root w-full max-w-md",
    card: "bg-[#0F172A] border border-white/10 shadow-2xl shadow-black/50 backdrop-blur-xl text-white [&_h1]:text-white [&_h2]:text-white [&_h3]:text-white [&_p]:text-white [&_label]:text-white [&_span]:text-white [&_a]:text-white [&_button]:text-white",
    formHeaderTitle: "text-white",
    formHeaderSubtitle: "text-white/90",
    headerTitle: "text-white text-2xl font-bold",
    headerSubtitle: "text-white/90",
    socialButtonsBlockButton: "bg-[#1E293B] border border-white/10 text-white hover:bg-[#273549] transition-all",
    socialButtonsBlockButtonText: "text-white font-medium",
    dividerLine: "bg-white/10",
    dividerText: "text-white",
    formFieldLabel: "text-white text-sm font-medium",
    formFieldAction: "text-white hover:text-white/80",
    formFieldInput: "bg-[#1E293B] border border-white/10 text-black placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg",
    phoneInputBox: "text-white",
    phoneInputCountrySelectButton: "text-white",
    phoneInputCountrySelectButtonText: "text-white",
    phoneInputCountrySelectButtonIcon: "text-white",
    phoneInputBoxInput: "text-white",
    phoneInputCountrySearchInput: "text-white placeholder:text-gray-400",
    phoneInputCountryListItem: "text-white",
    formButtonPrimary: "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-lg transition-all hover:shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-0.5 active:translate-y-0",
    footerActionText: "text-white",
    footerActionLink: "text-white hover:text-white/80 font-medium",
    identityPreviewText: "text-white",
    identityPreviewEditButton: "text-indigo-400",
    alertText: "text-red-400",
    formFieldErrorText: "text-red-400 text-xs",
    otpCodeFieldInput: "bg-[#1E293B] border-white/10 text-black",
  },
};

type AuthShellProps = {
  children: ReactNode;
};

export function AuthShell({ children }: AuthShellProps) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080C14]">
      <div className="pointer-events-none absolute top-1/4 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-indigo-600/10 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/3 left-1/3 h-[400px] w-[400px] rounded-full bg-violet-600/10 blur-[100px]" />

      <div className="absolute top-8 left-8 flex items-center gap-2">
        <span className="text-xl font-bold tracking-tight text-white">✦ MockMate</span>
      </div>

      {children}
    </main>
  );
}
