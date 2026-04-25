import { relations } from "drizzle-orm/relations";
import { users, subscriptions, plans, auditLogs, payments, interviewSessions, resumeProfiles } from "./schema";

export const subscriptionsRelations = relations(subscriptions, ({one, many}) => ({
	user: one(users, {
		fields: [subscriptions.userId],
		references: [users.id]
	}),
	plan: one(plans, {
		fields: [subscriptions.planId],
		references: [plans.id]
	}),
	payments: many(payments),
}));

export const usersRelations = relations(users, ({many}) => ({
	subscriptions: many(subscriptions),
	auditLogs: many(auditLogs),
	payments: many(payments),
	interviewSessions: many(interviewSessions),
	resumeProfiles: many(resumeProfiles),
}));

export const plansRelations = relations(plans, ({many}) => ({
	subscriptions: many(subscriptions),
}));

export const auditLogsRelations = relations(auditLogs, ({one}) => ({
	user: one(users, {
		fields: [auditLogs.userId],
		references: [users.id]
	}),
}));

export const paymentsRelations = relations(payments, ({one}) => ({
	user: one(users, {
		fields: [payments.userId],
		references: [users.id]
	}),
	subscription: one(subscriptions, {
		fields: [payments.subscriptionId],
		references: [subscriptions.id]
	}),
}));

export const interviewSessionsRelations = relations(interviewSessions, ({one}) => ({
	user: one(users, {
		fields: [interviewSessions.userId],
		references: [users.id]
	}),
}));

export const resumeProfilesRelations = relations(resumeProfiles, ({one}) => ({
	user: one(users, {
		fields: [resumeProfiles.userId],
		references: [users.id]
	}),
}));