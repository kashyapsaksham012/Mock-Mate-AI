import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./globals.css";
import "./landing.css";
import ChatWidget from "@/components/chat/ChatWidget";

export const metadata: Metadata = {
  title: "MockMate AI | Ace Every Interview",
  description: "Personalized mock interviews for any role, any level. Real feedback. Real improvement. Land the job you deserve with Gemini AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="scroll-smooth">
        <head>
          <link href="https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&f[]=cabinet-grotesk@400,500,700&display=swap" rel="stylesheet" />
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" />
        </head>
        <body className="antialiased">
          {children}
          <ToastContainer 
            position="bottom-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="dark"
            toastClassName="!bg-[#0D121F] !border !border-white/10 !rounded-2xl !backdrop-blur-xl !shadow-2xl"
            progressClassName="!bg-gradient-to-r !from-violet-500 !to-fuchsia-500"
          />
          <ChatWidget />
        </body>
      </html>
    </ClerkProvider>
  );
}
