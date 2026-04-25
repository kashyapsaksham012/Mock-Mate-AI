import { db } from './config/db';
import { plans, users } from './models/schema';
import { env } from './config/env';

async function seed() {
  console.log('🌱 Seeding database...');

  // Add Plans
  await db.insert(plans).values([
    {
      name: 'monthly',
      priceCents: 1900,
      interval: 'month',
      stripePriceId: 'price_monthly_mock',
    },
    {
      name: 'yearly',
      priceCents: 4900,
      interval: 'year',
      stripePriceId: 'price_yearly_mock',
    }
  ]).onConflictDoNothing();

  console.log('✅ Seeding complete!');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
