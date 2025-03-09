import React from 'react';
import { PricingPlans } from '@/components/subscription/pricing-plans';
import { PageHeader } from '@/components/ui/page-header';

/**
 * Pricing page displays subscription options and pricing plans
 */
export default function PricingPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Choose Your Plan"
        description="Unlock premium features with our subscription plans designed for musicians at every stage of their career."
      />
      
      <section className="mt-8">
        <PricingPlans />
      </section>
      
      <section className="mt-16 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-center">Frequently Asked Questions</h2>
        
        <div className="space-y-6">
          <div className="bg-card p-6 rounded-lg shadow-sm">
            <h3 className="font-semibold text-lg mb-2">What payment methods do you accept?</h3>
            <p className="text-muted-foreground">We accept all major credit cards, including Visa, Mastercard, and American Express.</p>
          </div>
          
          <div className="bg-card p-6 rounded-lg shadow-sm">
            <h3 className="font-semibold text-lg mb-2">Can I upgrade or downgrade my plan?</h3>
            <p className="text-muted-foreground">Yes, you can upgrade your plan at any time. When downgrading, the change will take effect at the end of your current billing cycle.</p>
          </div>
          
          <div className="bg-card p-6 rounded-lg shadow-sm">
            <h3 className="font-semibold text-lg mb-2">Do you offer a free trial?</h3>
            <p className="text-muted-foreground">Yes, our free tier allows you to explore core features while deciding which premium plan is right for you.</p>
          </div>
          
          <div className="bg-card p-6 rounded-lg shadow-sm">
            <h3 className="font-semibold text-lg mb-2">How do I cancel my subscription?</h3>
            <p className="text-muted-foreground">You can cancel your subscription at any time from your account settings. Your subscription will remain active until the end of your current billing period.</p>
          </div>
          
          <div className="bg-card p-6 rounded-lg shadow-sm">
            <h3 className="font-semibold text-lg mb-2">What happens to my data if I cancel?</h3>
            <p className="text-muted-foreground">Your account will revert to the free tier with limited features. Your music and profile data will remain accessible, but premium features will be disabled.</p>
          </div>
        </div>
      </section>
    </div>
  );
}