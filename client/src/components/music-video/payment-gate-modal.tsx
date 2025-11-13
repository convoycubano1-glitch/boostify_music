import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, Sparkles, CreditCard, Lock } from 'lucide-react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import type { Stripe } from '@stripe/stripe-js';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Load Stripe dynamically to prevent initialization errors
const getStripe = async (): Promise<Stripe | null> => {
  try {
    const { loadStripe } = await import('@stripe/stripe-js');
    const stripeKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
    
    if (!stripeKey) {
      console.warn('Stripe public key not configured');
      return null;
    }
    
    return await loadStripe(stripeKey);
  } catch (error) {
    console.error('Error loading Stripe:', error);
    return null;
  }
};

interface PaymentGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
  userEmail: string;
  demoImagesCount?: number;
  remainingImagesCount?: number;
}

function CheckoutForm({ onPaymentSuccess, userEmail }: { onPaymentSuccess: () => void; userEmail: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
        confirmParams: {
          return_url: window.location.origin,
        },
      });

      if (error) {
        toast({
          title: 'Payment Failed',
          description: error.message,
          variant: 'destructive',
        });
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        await apiRequest('POST', '/api/credits/verify-payment', {
          paymentIntentId: paymentIntent.id,
          email: userEmail,
        });

        toast({
          title: 'Payment Successful!',
          description: 'Your credits have been added. Continuing video generation...',
        });

        onPaymentSuccess();
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'An error occurred during payment',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full h-12 text-lg font-semibold"
        data-testid="button-complete-payment"
      >
        {isProcessing ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
            Processing...
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Pay $199 & Continue
          </div>
        )}
      </Button>
    </form>
  );
}

export function PaymentGateModal({
  isOpen,
  onClose,
  onPaymentSuccess,
  userEmail,
  demoImagesCount = 10,
  remainingImagesCount = 30,
}: PaymentGateModalProps) {
  const [clientSecret, setClientSecret] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      // Load Stripe when modal opens
      setStripePromise(getStripe());
      
      if (userEmail) {
        createPaymentIntent();
      }
    }
  }, [isOpen, userEmail]);

  const createPaymentIntent = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/credits/create-payment-intent', {
        email: userEmail,
        amount: 199,
      });

      setClientSecret(response.clientSecret);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to initialize payment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-payment-gate">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-center">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-8 h-8 text-yellow-500" />
              Love Your Preview?
            </div>
          </DialogTitle>
          <DialogDescription className="text-center text-lg mt-2">
            Continue to generate your complete music video
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Card className="border-2 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">Demo Complete!</h3>
                  <p className="text-muted-foreground">
                    You've generated <span className="font-bold text-primary">{demoImagesCount} preview images</span> of your music video.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-primary-foreground" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-4">Complete Your Video - $199</h3>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Generate <span className="font-bold">{remainingImagesCount} additional images</span> to complete your video</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Professional lip-sync with MuseTalk AI</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Full HD final video export</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Cinematic director-quality results</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Keep your {demoImagesCount} preview images in the final video</span>
                    </li>
                  </ul>
                  
                  <div className="bg-primary/10 rounded-lg p-4 mb-6">
                    <p className="text-sm text-muted-foreground mb-1">Total Generation Time</p>
                    <p className="text-2xl font-bold">~7 minutes</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      (Only {remainingImagesCount} images remaining - your {demoImagesCount} preview images are already done!)
                    </p>
                  </div>

                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                    </div>
                  ) : clientSecret ? (
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                      <CheckoutForm onPaymentSuccess={onPaymentSuccess} userEmail={userEmail} />
                    </Elements>
                  ) : (
                    <Button
                      onClick={createPaymentIntent}
                      className="w-full"
                      data-testid="button-retry-payment"
                    >
                      <CreditCard className="w-5 h-5 mr-2" />
                      Initialize Payment
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center text-sm text-muted-foreground">
            <Lock className="w-4 h-4 inline mr-1" />
            Secure payment powered by Stripe
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
