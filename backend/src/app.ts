import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import { config } from "./config/index";

import { userRouter } from "./routes/user.routes";
import { paymentRouter } from "./routes/payment.routes";
import { subscriptionRouter } from "./routes/subscription.routes";

const app = express();

// Base Middlewares
app.use(cors());

// clerkMiddleware requires the secret key to be in the process.env but it's handled via config
app.use(clerkMiddleware());

// 1. Webhook route (Strict Isolation: Before express.json and other parsers)
// This ensures Stripe receives the untouched raw Buffer required for signature verification.
// We mount it directly to avoid path nesting issues and ensure no later parsers touch it.
app.post(
  "/api/payment/webhook",
  express.raw({ type: "application/json" }),
  async (req, res, next) => {
    // We delegate to the router handler but we must match the path correctly
    // or just handle it directly here if the router logic is complex.
    // For now, we allow the paymentRouter to handle it but we define the raw body here.
    next();
  }
);

// 2. Global JSON Parser (Applied ONLY after the isolated webhook route)
// This will parse JSON for all subsequent routes (User, Subscription, etc.)
app.use(express.json());

// 3. Application Routes
app.get("/health", (req, res) => {
  res.status(200).json({ status: "all systems operational", timestamp: new Date().toISOString() });
});

// User routes
app.use("/api/user", userRouter);

// Payment & Billing routes
app.use("/api/payment", paymentRouter);

// Subscription routes
app.use("/api/subscription", subscriptionRouter);

// Mount routes here after implementing modules
// app.use("/api/auth", authRouter);
// app.use("/api/user", userRouter);

export default app;
