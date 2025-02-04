import { loadStripe } from '@stripe/stripe-js';

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing Stripe public key');
}

export const stripe = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export async function createPaymentSession(booking: {
  musicianId: string;
  price: number;
  currency: string;
}) {
  try {
    const response = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(booking),
    });

    if (!response.ok) {
      throw new Error('Failed to create payment session');
    }

    const { clientSecret } = await response.json();
    return clientSecret;
  } catch (error) {
    console.error('Error creating payment session:', error);
    throw error;
  }
}

export async function handlePayment(clientSecret: string) {
  if (!stripe) {
    throw new Error('Stripe not initialized');
  }

  const { paymentIntent, error } = await stripe.confirmPayment({
    elements: await stripe.elements({
      clientSecret,
      appearance: {
        theme: 'stripe',
      },
    }),
    confirmParams: {
      return_url: `${window.location.origin}/booking-confirmation`,
    },
  });

  if (error) {
    throw error;
  }

  return paymentIntent;
}
