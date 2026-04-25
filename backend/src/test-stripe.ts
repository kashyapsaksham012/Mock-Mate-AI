import Stripe from 'stripe';
import dotenv from 'dotenv';
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  typescript: true,
});

async function test() {
  try {
    console.log('🔍 Testing Stripe connection...');
    const products = await stripe.products.list({ limit: 1 });
    console.log('✅ Stripe connection successful! Found products:', products.data.length);
  } catch (err: any) {
    console.error('❌ Stripe connection failed:', err.message);
  }
}

test();
