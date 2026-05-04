import { pgTable, text, timestamp, boolean, integer, uuid, jsonb, index, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: text('id').primaryKey(), // Clerk user_id
  email: text('email').unique().notNull(),
  fullName: text('full_name'),
  stripeCustomerId: text('stripe_customer_id').unique(),
  freeTrialCount: integer('free_trial_count').default(3),
  hasSeenPricing: boolean('has_seen_pricing').default(false),
  trialInterviewsUsed: integer('trial_interviews_used').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Plans table
export const plans = pgTable('plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(), // 'monthly' | 'yearly'
  priceCents: integer('price_cents').notNull(), // 1900 | 4900
  interval: text('interval').notNull(), // 'month' | 'year'
  stripePriceId: text('stripe_price_id').unique().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Subscriptions table
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  planId: uuid('plan_id').notNull().references(() => plans.id),
  stripeSubscriptionId: text('stripe_subscription_id').unique().notNull(),
  stripeCustomerId: text('stripe_customer_id'),
  stripePriceId: text('stripe_price_id'),
  status: text('status').notNull(), // active, past_due, canceled, etc.
  currentPeriodStart: timestamp('current_period_start', { withTimezone: true }).notNull(),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }).notNull(),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
  canceledAt: timestamp('canceled_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    userIdx: index('idx_subscriptions_user_id').on(table.userId),
    statusIdx: index('idx_subscriptions_status').on(table.status),
  };
});

// Payments table
export const payments = pgTable('payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  subscriptionId: uuid('subscription_id').references(() => subscriptions.id),
  stripeInvoiceId: text('stripe_invoice_id').unique(),
  stripePaymentIntent: text('stripe_payment_intent'),
  amountCents: integer('amount_cents').notNull(),
  currency: text('currency').default('usd'),
  status: text('status').notNull(), // succeeded | failed | refunded
  paidAt: timestamp('paid_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    userIdx: index('idx_payments_user_id').on(table.userId),
  };
});

// Audit Logs table
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').references(() => users.id),
  event: text('event').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    userIdx: index('idx_audit_user_id').on(table.userId),
  };
});

// Resume Profiles table (one profile per user)
export const resumeProfiles = pgTable('resume_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  fullName: text('full_name'),
  email: text('email'),
  currentRole: text('current_role'),
  experience: text('experience'),
  skills: text('skills').array(),
  primaryDomain: text('primary_domain'),
  targetRole: text('target_role'),
  companyType: text('company_type'),
  focusAreas: text('focus_areas').array(),
  deepDiveTopics: text('deep_dive_topics').array(),
  notes: text('notes'),
  fileUrl: text('file_url'),
  parserSource: text('parser_source'),
  lastDifficulty: text('last_difficulty').default('Medium'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    userIdx: index('idx_resume_profiles_user_id').on(table.userId),
  };
});

// Interview Sessions table
export const interviewSessions = pgTable('interview_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  targetRole: text('target_role').notNull(),
  difficulty: text('difficulty').notNull(),
  companyType: text('company_type'),
  focusAreas: text('focus_areas').array(),
  deepDiveTopics: text('deep_dive_topics').array(),
  notes: text('notes'),
  questions: jsonb('questions').notNull(), // Array of {id, question, type, hint}
  status: text('status').notNull().default('active'), // active, completed
  overallScore: integer('overall_score'),
  overallFeedback: text('overall_feedback'),
  improvementTips: text('improvement_tips'),
  precisionLevel: integer('precision_level'),
  nodesAnalyzed: integer('nodes_analyzed'),
  growthPotential: text('growth_potential'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    userIdx: index('idx_interview_sessions_user_id').on(table.userId),
  };
});

// Interview Answers table
export const interviewAnswers = pgTable('interview_answers', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').notNull().references(() => interviewSessions.id, { onDelete: 'cascade' }),
  questionId: integer('question_id').notNull(),
  answerText: text('answer_text').notNull(),
  score: integer('score'), // 0-100
  aiFeedback: text('ai_feedback'),
  aiTip: text('ai_tip'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    sessionIdx: index('idx_interview_answers_session_id').on(table.sessionId),
    sessionQuestionUnique: unique('uq_session_question').on(table.sessionId, table.questionId),
  };
});

// Chat Sessions table
export const chatSessions = pgTable('chat_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    userIdx: index('idx_chat_sessions_user_id').on(table.userId),
  };
});

// Chat Messages table
export const chatMessages = pgTable('chat_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').notNull().references(() => chatSessions.id, { onDelete: 'cascade' }),
  role: text('role').notNull(), // 'user' | 'model'
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    sessionIdx: index('idx_chat_messages_session_id').on(table.sessionId),
  };
});

// Relations definitions
export const usersRelations = relations(users, ({ many }) => ({
  subscriptions: many(subscriptions),
  payments: many(payments),
  auditLogs: many(auditLogs),
  resumeProfiles: many(resumeProfiles),
  interviewSessions: many(interviewSessions),
  chatSessions: many(chatSessions),
}));

export const interviewSessionsRelations = relations(interviewSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [interviewSessions.userId],
    references: [users.id],
  }),
  answers: many(interviewAnswers),
}));

export const interviewAnswersRelations = relations(interviewAnswers, ({ one }) => ({
  session: one(interviewSessions, {
    fields: [interviewAnswers.sessionId],
    references: [interviewSessions.id],
  }),
}));

export const chatSessionsRelations = relations(chatSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [chatSessions.userId],
    references: [users.id],
  }),
  messages: many(chatMessages),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  session: one(chatSessions, {
    fields: [chatMessages.sessionId],
    references: [chatSessions.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
  plan: one(plans, {
    fields: [subscriptions.planId],
    references: [plans.id],
  }),
  payments: many(payments),
}));

export const resumeProfilesRelations = relations(resumeProfiles, ({ one }) => ({
  user: one(users, {
    fields: [resumeProfiles.userId],
    references: [users.id],
  }),
}));

