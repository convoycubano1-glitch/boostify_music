import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { ExtraServicesSection } from '@/components/services/extra-services-section';
import { Card } from '@/components/ui/card';
import { Sparkles, Shield, Zap } from 'lucide-react';

export default function ExtraServicesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="mb-12">
          <div className="flex items-start gap-3 mb-6">
            <Sparkles className="w-8 h-8 text-primary mt-1 flex-shrink-0" />
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-3">Services Without Subscription</h1>
              <p className="text-lg text-muted-foreground max-w-2xl">
                Access premium creator services for a one-time payment. No subscription required. All services are available to every user.
              </p>
            </div>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <Card className="p-6 border border-primary/20 bg-primary/5">
              <div className="flex items-start gap-3">
                <Shield className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">Verified Creators</h3>
                  <p className="text-sm text-muted-foreground">Only highly-rated professionals with proven track records</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 border border-primary/20 bg-primary/5">
              <div className="flex items-start gap-3">
                <Zap className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">Pay Per Service</h3>
                  <p className="text-sm text-muted-foreground">No commitment - pay only for what you need</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 border border-primary/20 bg-primary/5">
              <div className="flex items-start gap-3">
                <Sparkles className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">Professional Results</h3>
                  <p className="text-sm text-muted-foreground">Expert services delivered by industry professionals</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Services Section */}
        <div className="space-y-12">
          <ExtraServicesSection 
            category="youtube_boost"
            title="YouTube Boost Services"
            description="Grow your YouTube channel with expert services including SEO optimization, viral promotion, and professional setup"
          />

          <ExtraServicesSection 
            category="spotify_boost"
            title="Spotify Services"
            description="Boost your music on Spotify with our premium promotion services"
          />

          <ExtraServicesSection 
            category="instagram_boost"
            title="Instagram Services"
            description="Enhance your Instagram presence with expert growth strategies"
          />
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl">
          <h2 className="text-2xl font-bold mb-8">Frequently Asked Questions</h2>
          
          <div className="space-y-4">
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Do I need a subscription to use these services?</h3>
              <p className="text-sm text-muted-foreground">No! These services are available to all users with or without a Boostify subscription. You only pay for the services you want.</p>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-2">How long does delivery take?</h3>
              <p className="text-sm text-muted-foreground">Most services are delivered within 1-3 business days. Delivery time is specified for each service.</p>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-2">Are these services guaranteed to work?</h3>
              <p className="text-sm text-muted-foreground">Our creators are carefully vetted professionals with excellent ratings and reviews. However, results vary based on your content and platform algorithms.</p>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-2">Can I cancel an order?</h3>
              <p className="text-sm text-muted-foreground">You can cancel orders before the service starts being delivered. Once delivery begins, you'll need to contact the creator directly.</p>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
