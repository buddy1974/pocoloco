import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
})

export const PLANS = {
  basic: {
    name: 'Basic',
    price: '€9.99',
    priceId: process.env.STRIPE_PRICE_BASIC!,
    tier: 'basic',
    features: [
      '10 picks per day',
      'Full reasoning visible',
      'Form + H2H data',
      'Value 1X2 picks',
    ],
  },
  pro: {
    name: 'Pro',
    price: '€24.99',
    priceId: process.env.STRIPE_PRICE_PRO!,
    tier: 'pro',
    features: [
      'Unlimited picks',
      'All strategies (Dutching + Sure Bet)',
      'Telegram alerts for HIGH picks',
      'Accumulator builder',
      'Calibration dashboard',
      'AI full analysis',
    ],
  },
  elite: {
    name: 'Elite',
    price: '€49.99',
    priceId: process.env.STRIPE_PRICE_ELITE!,
    tier: 'elite',
    features: [
      'Everything in Pro',
      'Custom league selection',
      'API access',
      'Priority Telegram support',
      'Early access to new features',
    ],
  },
} as const

export type PlanId = keyof typeof PLANS
