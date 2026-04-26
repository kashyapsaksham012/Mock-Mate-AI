import { WebhookEvent } from '@clerk/clerk-sdk-node';
import { db } from '../../config/db';
import { users } from '../../models/schema';
import { eq } from 'drizzle-orm';

export class ClerkWebhookHandler {
  static async handleEvent(event: WebhookEvent) {
    console.log(`[Clerk Webhook] Received event type: ${event.type}`);

    try {
      switch (event.type) {
        case 'user.created':
          await this.handleUserCreated(event.data);
          break;
        case 'user.updated':
          await this.handleUserUpdated(event.data);
          break;
        case 'user.deleted':
          await this.handleUserDeleted(event.data);
          break;
        default:
          console.log(`[Clerk Webhook] Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error(`[Clerk Webhook] Error processing event ${event.type}:`, error);
      throw error;
    }
  }

  private static async handleUserCreated(data: any) {
    const primaryEmail = data.email_addresses?.find(
      (e: any) => e.id === data.primary_email_address_id
    )?.email_address;

    const fullName = [data.first_name, data.last_name].filter(Boolean).join(' ') || null;

    if (!primaryEmail) {
      console.warn(`[Clerk Webhook] User ${data.id} has no primary email. Cannot sync.`);
      return;
    }

    // Upsert for idempotency because webhook delivery may retry.
    await db.insert(users).values({
      id: data.id,
      email: primaryEmail,
      fullName: fullName,
    }).onConflictDoUpdate({
      target: users.id,
      set: {
        email: primaryEmail,
        fullName: fullName,
        updatedAt: new Date(),
      },
    });
    console.log(`[Clerk Webhook] Successfully synced user ${data.id} into database.`);
  }

  private static async handleUserUpdated(data: any) {
    const primaryEmail = data.email_addresses?.find(
      (e: any) => e.id === data.primary_email_address_id
    )?.email_address;

    const fullName = [data.first_name, data.last_name].filter(Boolean).join(' ') || null;

    if (!primaryEmail) return;

    await db.update(users)
      .set({ email: primaryEmail, fullName: fullName, updatedAt: new Date() })
      .where(eq(users.id, data.id));
  }

  private static async handleUserDeleted(data: any) {
    if (!data.id) return;
    
    // Deleting the user will cascade drop subscriptions based on our schema definitions
    await db.delete(users).where(eq(users.id, data.id));
  }
}
