import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT SET',
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? 'SET (starts with: ' + process.env.STRIPE_SECRET_KEY.substring(0, 8) + '...)' : 'NOT SET',
    STRIPE_SUPPORTER_PRICE_ID: process.env.STRIPE_SUPPORTER_PRICE_ID || 'NOT SET',
    STRIPE_PRO_PRICE_ID: process.env.STRIPE_PRO_PRICE_ID || 'NOT SET',
  });
}
