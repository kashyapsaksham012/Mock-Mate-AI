import express, { ErrorRequestHandler } from 'express';
import cors from 'cors';
import { env } from './config/env';
import { db } from './config/db'; // Ensure top-level initialization

import { billingRoutes } from './modules/billing/billing.routes';
import { webhookRoutes } from './modules/webhook/webhook.routes';
import { clerkWebhookRoutes } from './modules/webhook/clerk-webhook.routes';
import { subscriptionGuard } from './middleware/subscriptionGuard';
import { requireAuth } from './middleware/auth';
import { AppError } from './utils/errors';

const app = express();

// Global Middlewares
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));

// Ensure raw bodies are passed to Webhooks BEFORE express.json()
app.use('/api/webhooks', webhookRoutes);
app.use('/api/webhooks', clerkWebhookRoutes);

// Apply standard JSON parser for all other routes
app.use(express.json());

// API Routes
app.use('/api/billing', billingRoutes);

// Example protected feature route using the fast-path subscription guard
app.get('/api/features/premium-content', requireAuth, subscriptionGuard, (req, res) => {
  res.json({
    data: "This is premium content only visible to active subscribers.",
    subscriptionDetails: (req as any).subscription,
  });
});
// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});


// Error Handling Middleware
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error('[Error]:', err);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
  } else {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`🚀 Server started on port ${env.PORT}`);
  console.log(`🔌 Database config initialized.`);
});
