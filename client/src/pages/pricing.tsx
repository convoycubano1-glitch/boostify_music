import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, Zap, Music, Video, Users, Crown, Sparkles, 
  ArrowRight, Globe, Headphones, Mic2, BarChart3
} from 'lucide-react';
import { Link } from 'wouter';
import pricingDashboardImg from '@assets/generated_images/modern_pricing_dashboard_ui.png';
import musicIndustryImg from '@assets/generated_images/music_industry_abstract_art.png';

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
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

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
            className="rounded-2xl overflow-hidden border border-orange-500/20 shadow-2xl mb-16"
          >
            <img src={pricingDashboardImg} alt="Pricing Dashboard" className="w-full h-auto" />
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

                      <Link href={plan.id === 'discover' ? '/auth-signup' : '/auth-signup'}>
                        <Button className={`w-full mb-6 ${plan.highlighted ? `bg-gradient-to-r ${plan.color} hover:shadow-lg hover:shadow-orange-500/50` : 'bg-slate-700 hover:bg-slate-600'} text-white font-semibold transition-all`}>
                          Get Started
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>

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
              className="rounded-2xl overflow-hidden border border-orange-500/20"
            >
              <img src={musicIndustryImg} alt="Music Industry" className="w-full h-auto" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="relative z-10 py-20 px-4 hidden lg:block">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="text-4xl font-bold text-center mb-4">Feature Comparison</h2>
            <p className="text-slate-300 text-center">See what's included in each plan</p>
          </motion.div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="px-6 py-4 text-left font-semibold">Features</th>
                  {plans.map(plan => (
                    <th key={plan.id} className="px-6 py-4 text-center font-semibold text-orange-400">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {['Artist Hub', 'AI Content Creation', 'Analytics', 'Growth Tools', 'Record Label', 'Expert Support'].map((feature, idx) => (
                  <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/50 transition">
                    <td className="px-6 py-4 font-medium text-slate-300">{feature}</td>
                    {plans.map(plan => (
                      <td key={`${plan.id}-${idx}`} className="px-6 py-4 text-center">
                        {(
                          (feature === 'Artist Hub' && plan.id !== 'discover') ||
                          (feature === 'AI Content Creation' && plan.id !== 'discover') ||
                          (feature === 'Analytics' && plan.id !== 'discover') ||
                          (feature === 'Growth Tools' && (plan.id === 'amplify' || plan.id === 'dominate')) ||
                          (feature === 'Record Label' && plan.id === 'dominate') ||
                          (feature === 'Expert Support' && plan.id === 'dominate')
                        ) ? (
                          <CheckCircle2 className="w-5 h-5 text-green-400 mx-auto" />
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
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
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth-signup">
                <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:shadow-lg hover:shadow-orange-500/50 text-white font-bold px-8 py-3 rounded-lg text-lg">
                  Start Free Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" className="border-orange-500/50 text-white hover:bg-orange-500/10 font-bold px-8 py-3 rounded-lg text-lg">
                  Contact Sales
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer Info */}
      <section className="relative z-10 py-12 px-4 border-t border-slate-700">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <h3 className="font-bold mb-2">Flexible Plans</h3>
              <p className="text-slate-400">Upgrade or downgrade anytime. No long-term contracts.</p>
            </div>
            <div>
              <h3 className="font-bold mb-2">Secure Payments</h3>
              <p className="text-slate-400">Powered by Stripe. Your data is always protected.</p>
            </div>
            <div>
              <h3 className="font-bold mb-2">Money-Back Guarantee</h3>
              <p className="text-slate-400">30-day satisfaction guarantee on all plans.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
