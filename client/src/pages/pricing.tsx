import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle2, Zap, Music, Video, Users, Crown, Sparkles, 
  ArrowRight, Globe, Headphones, Mic2, BarChart3, Loader2
} from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { logger } from '@/lib/logger';

const plans = [
  {
    id: 'discover',
    name: 'Discover',
    price: '$0',
    period: 'Forever free',
    description: 'Start your music journey',
    color: 'from-slate-500 to-slate-700',
    icon: Music,
    highlighted: false,
    priceId: null,
    features: [
      'Community Hub',
      'Merch Store',
      'Learn Hub',
      'BoostifyTV',
      'Earn Commissions'
    ]
  },
  {
    id: 'elevate',
    name: 'Elevate',
    price: '$59.99',
    period: 'per month',
    description: 'Build your fanbase',
    color: 'from-orange-500 to-orange-700',
    icon: Headphones,
    highlighted: true,
    priceId: 'price_1R0lay2LyFplWimfQxUL6Hn0',
    features: [
      'Everything in Discover',
      'Artist Hub',
      'Spotify Growth Engine',
      'Contract Templates',
      'PR Starter Kit',
      'News & Events Hub',
      'Content Studio',
      'Creative Image AI',
      'Master Classes',
      'Expert Advisors (3/month)'
    ]
  },
  {
    id: 'amplify',
    name: 'Amplify',
    price: '$99.99',
    period: 'per month',
    description: 'Scale globally',
    color: 'from-orange-600 to-red-600',
    icon: Zap,
    highlighted: false,
    priceId: 'price_1R0laz2LyFplWimfsBd5ASoa',
    features: [
      'Everything in Elevate',
      'Pro Analytics Engine',
      'YouTube Mastery Suite',
      'Instagram Domination Suite',
      'Career Manager Suite',
      'Music Production Lab',
      'AI Music Studio (Advanced)',
      'Premium Merch Hub',
      'Global Language Studio',
      'Creative Canvas AI (50/month)',
      'Expert Advisors (10/month)'
    ]
  },
  {
    id: 'dominate',
    name: 'Dominate',
    price: '$149.99',
    period: 'per month',
    description: 'Maximum power',
    color: 'from-orange-700 to-red-700',
    icon: Crown,
    highlighted: false,
    priceId: 'price_1R0lb12LyFplWimf7JpMynKA',
    features: [
      'Everything in Amplify',
      'Virtual Label Empire (10 artists)',
      'AI Agent Suite (Unlimited)',
      'Expert Advisors (Unlimited)',
      'Artist Generator Pro',
      'Global Ecosystem Hub',
      'Premium Video Studio (Unlimited)',
      'Enterprise Analytics',
      'YouTube Mastery Unlimited',
      'Instagram Domination Unlimited',
      'Spotify Growth Unlimited',
      'VIP Support (24/7)'
    ]
  }
];

const highlights = [
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: 'AI-Powered Tools',
    description: 'Create stunning content with cutting-edge AI technology'
  },
  {
    icon: <Globe className="w-6 h-6" />,
    title: 'Global Reach',
    description: 'Connect with fans and grow your audience worldwide'
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: 'Advanced Analytics',
    description: 'Track your progress with detailed insights and metrics'
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: 'Community Support',
    description: 'Get help from artists and experts anytime'
  }
];

export default function PricingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);

  const handleSelectPlan = async (plan: typeof plans[0]) => {
    try {
      setProcessingPlanId(plan.id);

      // Plan gratis - ir a login
      if (!plan.priceId) {
        window.location.href = '/api/login';
        return;
      }

      toast({
        title: "Redirigiendo a Stripe",
        description: `Iniciando checkout para ${plan.name}...`
      });

      // Hacer llamado directo a Stripe sin autenticación
      const response = await fetch('/api/stripe/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: plan.priceId
        })
      });

      const data = await response.json();
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.message || 'No se pudo crear la sesión de checkout');
      }

    } catch (error) {
      logger.error('Error selecting plan:', error);
      toast({
        title: "Error",
        description: "No se pudo procesar tu solicitud. Por favor intenta de nuevo.",
        variant: "destructive"
      });
      setProcessingPlanId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}} />
      </div>

      {/* Hero Section with Image */}
      <section className="relative z-10 pt-20 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <Badge className="mb-4 px-4 py-1 bg-orange-500/20 text-orange-300 border-orange-500/50">
              <Sparkles className="w-3 h-3 mr-2" />
              Transparent Pricing
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-white via-orange-200 to-orange-500 bg-clip-text text-transparent mb-6">
              Plans for Every Stage
            </h1>
            
            <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-8">
              From discovering your sound to dominating the industry. No hidden fees, cancel anytime.
            </p>
          </motion.div>

          {/* Hero Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="rounded-2xl overflow-hidden border border-orange-500/20 shadow-2xl mb-16 bg-slate-800/50"
          >
            <img 
              src="/images/modern_pricing_dashboard_ui.png" 
              alt="Pricing Dashboard" 
              className="w-full h-auto"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {plans.map((plan, index) => {
              const Icon = plan.icon;
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className={`relative h-full bg-gradient-to-br ${plan.highlighted ? `${plan.color}/20` : 'slate-800/50'} border-2 ${plan.highlighted ? `border-orange-500` : 'border-slate-700'} hover:border-orange-400 transition-all duration-300 overflow-hidden group`}>
                    {plan.highlighted && (
                      <div className="absolute -top-1 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-red-500" />
                    )}
                    
                    {plan.highlighted && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                          Most Popular
                        </Badge>
                      </div>
                    )}

                    <div className="p-8">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>

                      <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                      <p className="text-slate-300 text-sm mb-6">{plan.description}</p>

                      <div className="mb-6">
                        <span className="text-4xl font-black">{plan.price}</span>
                        <span className="text-slate-400 text-sm ml-2">{plan.period}</span>
                      </div>

                      <Button 
                        onClick={() => handleSelectPlan(plan)}
                        disabled={processingPlanId === plan.id}
                        className={`w-full mb-6 ${plan.highlighted ? `bg-gradient-to-r ${plan.color} hover:shadow-lg hover:shadow-orange-500/50` : 'bg-slate-700 hover:bg-slate-600'} text-white font-semibold transition-all`}
                        data-testid={`button-select-plan-${plan.id}`}
                      >
                        {processingPlanId === plan.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Procesando...
                          </>
                        ) : (
                          <>
                            Get Started
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>

                      <div className="space-y-3">
                        {plan.features.slice(0, 6).map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                            <span className="text-sm text-slate-300">{feature}</span>
                          </div>
                        ))}
                        {plan.features.length > 6 && (
                          <div className="text-sm text-orange-400 font-semibold">+ {plan.features.length - 6} more features</div>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Highlights Section with Image */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-white to-orange-400 bg-clip-text text-transparent mb-4">
              Why Join Boostify
            </h2>
            <p className="text-slate-300 text-lg max-w-2xl">
              Everything you need to succeed as an artist in the modern music industry
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="grid grid-cols-2 gap-6">
              {highlights.map((highlight, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-orange-500/50 transition-all"
                >
                  <div className="text-orange-400 mb-3">{highlight.icon}</div>
                  <h3 className="font-bold mb-2">{highlight.title}</h3>
                  <p className="text-slate-300 text-sm">{highlight.description}</p>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="rounded-2xl overflow-hidden border border-orange-500/20 bg-slate-800/50"
            >
              <img 
                src="/images/music_industry_abstract_art.png" 
                alt="Music Industry" 
                className="w-full h-auto"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-black mb-6">Ready to Boost Your Music?</h2>
            <p className="text-xl text-slate-300 mb-8">
              Join thousands of artists already growing with Boostify. Start free, upgrade anytime.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
