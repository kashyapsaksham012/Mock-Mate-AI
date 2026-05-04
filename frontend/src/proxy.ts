import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/pricing(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const userAgent = req.headers.get("user-agent") || "";
  const isVercelBot = userAgent.toLowerCase().includes("vercel-screenshot");

  if (!isPublicRoute(req) && !isVercelBot) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};

