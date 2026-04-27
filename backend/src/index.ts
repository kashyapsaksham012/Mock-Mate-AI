import express, { ErrorRequestHandler } from 'express';
import cors from 'cors';
import { env } from './config/env';
import { db } from './config/db';

import { billingRoutes } from './modules/billing/billing.routes';
import { webhookRoutes } from './modules/webhook/webhook.routes';
import { clerkWebhookRoutes } from './modules/webhook/clerk-webhook.routes';
import { resumeRoutes } from './modules/resume/resume.routes';
import { interviewRoutes } from './modules/interview/interview.routes';
import { chatRoutes } from './modules/chat/chat.routes';
import { subscriptionGuard } from './middleware/subscriptionGuard';
import { requireAuth } from './middleware/auth';
import { AppError } from './utils/errors';

const app = express();

// Global Middlewares
app.use(cors({ 
  origin: [
    'https://mock-mate-ai-alpha.vercel.app',
    env.FRONTEND_URL
  ], 
  credentials: true 
}));

// API Routes
// Note: Resume upload is registered before express.json to prevent stream interference
app.use('/api/resume', resumeRoutes);

// Webhooks
app.use('/api/webhooks', webhookRoutes);
app.use('/api/webhooks', clerkWebhookRoutes);

// JSON Parser for all other routes
app.use(express.json());

// Main App Routes
app.use('/api/billing', billingRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/chat', chatRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error Handling
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
