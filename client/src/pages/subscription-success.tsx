import React, { useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { CheckCircle2 } from 'lucide-react';
import { Link } from 'wouter';
import { useSubscription } from '../lib/context/subscription-context';

/**
 * This page is displayed after a successful subscription purchase
 * Stripe redirects to this page after checkout completion
 */
export default function SubscriptionSuccessPage() {
  const { refreshSubscription } = useSubscription();
  
  // Refresh subscription status when page loads
  useEffect(() => {
    refreshSubscription();
  }, [refreshSubscription]);
  
  return (
    <div className="container max-w-2xl mx-auto px-4 py-16">
      <Card className="border-green-200">
        <CardHeader className="text-center">
          <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-500" />
          <CardTitle className="text-2xl sm:text-3xl">Subscription Successful!</CardTitle>
          <CardDescription className="text-lg">
            Thank you for subscribing to Boostify.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p>
            Your subscription has been activated successfully. You now have access to premium features based on your chosen plan.
          </p>
          <p className="text-muted-foreground">
            You will receive a confirmation email with your subscription details shortly.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-center gap-4">
          <Button asChild>
            <Link href="/account">
              View Subscription
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">
              Go to Dashboard
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}