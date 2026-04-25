import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/**
 * Users Table
 */
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  email: text("email").notNull(),
  stripeCustomerId: text("stripe_customer_id").unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Subscriptions Table
 */
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  stripeCustomerId: text("stripe_customer_id").notNull().unique(), // Added unique constraint
  stripeSubscriptionId: text("stripe_subscription_id").notNull().unique(),
  
  // Specific plan mapping requested by user
  plan: text("plan", { enum: ["pro_monthly", "pro_annual"] }).notNull(),
  
  // Specific status mapping requested by user
  status: text("status", { 
    enum: ["active", "trialing", "past_due", "canceled"] 
  }).notNull(),
  
  currentPeriodEnd: timestamp("current_period_end"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Stripe Events (Idempotency)
 */
export const stripeEvents = pgTable("stripe_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  stripeEventId: text("stripe_event_id").notNull().unique(),
  type: text("type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Relations
 */
export const usersRelations = relations(users, ({ one }) => ({
  subscription: one(subscriptions, {
    fields: [users.id],
    references: [subscriptions.userId],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type StripeEvent = typeof stripeEvents.$inferSelect;
