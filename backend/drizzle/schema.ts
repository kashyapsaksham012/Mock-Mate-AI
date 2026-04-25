import { pgTable, unique, text, timestamp, index, foreignKey, uuid, boolean, jsonb, integer } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const users = pgTable("users", {
	id: text().primaryKey().notNull(),
	email: text().notNull(),
	fullName: text("full_name"),
	stripeCustomerId: text("stripe_customer_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	unique("users_email_unique").on(table.email),
	unique("users_stripe_customer_id_unique").on(table.stripeCustomerId),
]);

export const subscriptions = pgTable("subscriptions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	planId: uuid("plan_id").notNull(),
	stripeSubscriptionId: text("stripe_subscription_id").notNull(),
	status: text().notNull(),
	currentPeriodStart: timestamp("current_period_start", { withTimezone: true, mode: 'string' }).notNull(),
	currentPeriodEnd: timestamp("current_period_end", { withTimezone: true, mode: 'string' }).notNull(),
	cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
	canceledAt: timestamp("canceled_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	stripeCustomerId: text("stripe_customer_id"),
	stripePriceId: text("stripe_price_id"),
}, (table) => [
	index("idx_subscriptions_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_subscriptions_user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "subscriptions_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.planId],
			foreignColumns: [plans.id],
			name: "subscriptions_plan_id_plans_id_fk"
		}),
	unique("subscriptions_stripe_subscription_id_unique").on(table.stripeSubscriptionId),
]);

export const auditLogs = pgTable("audit_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id"),
	event: text().notNull(),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_audit_user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "audit_logs_user_id_users_id_fk"
		}),
]);

export const payments = pgTable("payments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	subscriptionId: uuid("subscription_id"),
	stripeInvoiceId: text("stripe_invoice_id"),
	stripePaymentIntent: text("stripe_payment_intent"),
	amountCents: integer("amount_cents").notNull(),
	currency: text().default('usd'),
	status: text().notNull(),
	paidAt: timestamp("paid_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_payments_user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "payments_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.subscriptionId],
			foreignColumns: [subscriptions.id],
			name: "payments_subscription_id_subscriptions_id_fk"
		}),
	unique("payments_stripe_invoice_id_unique").on(table.stripeInvoiceId),
]);

export const interviewSessions = pgTable("interview_sessions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	targetRole: text("target_role").notNull(),
	difficulty: text().notNull(),
	questions: jsonb().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_interview_sessions_user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "interview_sessions_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const plans = pgTable("plans", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	priceCents: integer("price_cents").notNull(),
	interval: text().notNull(),
	stripePriceId: text("stripe_price_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	unique("plans_stripe_price_id_unique").on(table.stripePriceId),
]);

export const resumeProfiles = pgTable("resume_profiles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	fullName: text("full_name"),
	email: text(),
	currentRole: text("current_role"),
	experience: text(),
	skills: text().array(),
	primaryDomain: text("primary_domain"),
	targetRole: text("target_role"),
	fileUrl: text("file_url"),
	parserSource: text("parser_source"),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	lastDifficulty: text("last_difficulty").default('Medium'),
}, (table) => [
	index("idx_resume_profiles_user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "resume_profiles_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("resume_profiles_user_id_unique").on(table.userId),
]);
