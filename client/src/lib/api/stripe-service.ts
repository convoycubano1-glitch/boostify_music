import { loadStripe } from '@stripe/stripe-js';

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing Stripe public key');
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export async function createPaymentSession(booking: {
  musicianId: string;
  price: number;
  currency: string;
}) {
  try {
    console.log('Creating payment session with data:', booking);

    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      credentials: 'include', 
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(booking),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Server error:', data);
      throw new Error(data.error || 'Failed to create payment session');
    }

    if (!data.sessionId) {
      console.error('Missing sessionId in response:', data);
      throw new Error('Invalid server response - missing session ID');
    }

    console.log('Successfully created checkout session:', data.sessionId);

    const stripe = await stripePromise;
    if (!stripe) {
      throw new Error('Stripe not initialized');
    }

    const { error } = await stripe.redirectToCheckout({
      sessionId: data.sessionId
    });

    if (error) {
      console.error('Stripe redirect error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error creating payment session:', error);
    throw error;
  }
}