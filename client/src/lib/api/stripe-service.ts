import { loadStripe } from '@stripe/stripe-js';
import { auth } from '@/lib/firebase';

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
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Must be logged in to create a payment session');
    }

    const idToken = await currentUser.getIdToken();

    console.log('Creating payment session with data:', booking);

    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      credentials: 'include',
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

export async function createCourseEnrollmentSession(course: {
  courseId: string;
  title: string;
  price: number;
  thumbnail?: string;
}) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Must be logged in to enroll in a course');
    }

    const idToken = await currentUser.getIdToken();

    console.log('Creating enrollment session for course:', course);

    const response = await fetch('/api/create-course-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      credentials: 'include',
      body: JSON.stringify({
        courseId: course.courseId,
        title: course.title,
        price: course.price,
        thumbnail: course.thumbnail
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Server error:', data);
      throw new Error(data.error || 'Failed to create enrollment session');
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
    console.error('Error creating enrollment session:', error);
    throw error;
  }
}