import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle2, Zap, Music, Video, Users, Crown, Sparkles, 
  ArrowRight, Globe, Headphones, Mic2, BarChart3, Loader2,
  Star, TrendingUp, Shield, Rocket, Gift, X, Play, ChevronRight
} from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { logger } from '@/lib/logger';

const plans = [
  {
    id: 'discover',
    name: 'Discover',
    monthlyPrice: 0,
    yearlyPrice: 0,
    period: 'Forever free',
    description: 'Perfect for exploring',
    tagline: 'Start your journey',
    color: 'from-slate-600 to-slate-800',
    accentColor: 'slate',
    icon: Music,
    highlighted: false,
    priceId: null,
    yearlyPriceId: null,
    features: [
      { text: 'Community Hub', included: true },
      { text: 'Merch Store Access', included: true },
      { text: 'Learn Hub Basics', included: true },
      { text: 'BoostifyTV Streaming', included: true },
      { text: 'Earn Commissions', included: true },
      { text: 'Artist Hub', included: false },
      { text: 'Spotify Growth', included: false },
      { text: 'AI Tools', included: false },
    ]
  },
  {
    id: 'elevate',
    name: 'Elevate',
    monthlyPrice: 59.99,
    yearlyPrice: 599.99,
    period: 'per month',
    description: 'For serious artists',
    tagline: 'Build your fanbase',
    color: 'from-orange-500 to-amber-600',
    accentColor: 'orange',
    icon: Headphones,
    highlighted: true,
    badge: '🔥 Most Popular',
    priceId: 'price_1R0lay2LyFplWimfQxUL6Hn0',
    yearlyPriceId: 'price_1Sei7X2LyFplWimfMgbnJvPM',
    savings: 'Save $120/year',
    features: [
      { text: 'Everything in Discover', included: true, highlight: true },
      { text: 'Artist Hub Pro', included: true },
      { text: 'Spotify Growth Engine', included: true },
      { text: 'Contract Templates', included: true },
      { text: 'PR Starter Kit', included: true },
      { text: 'Content Studio', included: true },
      { text: 'Creative Image AI', included: true },
      { text: 'Master Classes', included: true },
      { text: 'Expert Advisors (3/mo)', included: true },
    ]
  },
  {
    id: 'amplify',
    name: 'Amplify',
    monthlyPrice: 99.99,
    yearlyPrice: 999.99,
    period: 'per month',
    description: 'Scale globally',
    tagline: 'Go viral worldwide',
    color: 'from-purple-500 to-violet-600',
    accentColor: 'purple',
    icon: Zap,
    highlighted: false,
    priceId: 'price_1R0laz2LyFplWimfsBd5ASoa',
    yearlyPriceId: 'price_1Sei7X2LyFplWimfL1qscrKR',
    savings: 'Save $200/year',
    features: [
      { text: 'Everything in Elevate', included: true, highlight: true },
      { text: 'Pro Analytics Engine', included: true },
      { text: 'YouTube Mastery Suite', included: true },
      { text: 'Instagram Domination', included: true },
      { text: 'Career Manager Suite', included: true },
      { text: 'AI Music Studio Pro', included: true },
      { text: 'Premium Merch Hub', included: true },
      { text: 'Creative Canvas AI (50/mo)', included: true },
      { text: 'Expert Advisors (10/mo)', included: true },
    ]
  },
  {
    id: 'dominate',
    name: 'Dominate',
    monthlyPrice: 149.99,
    yearlyPrice: 1499.99,
    period: 'per month',
    description: 'Maximum power',
    tagline: 'Rule the industry',
    color: 'from-rose-500 to-pink-600',
    accentColor: 'rose',
    icon: Crown,
    highlighted: false,
    priceId: 'price_1Sei8R2LyFplWimfXK8dAE06',
    yearlyPriceId: 'price_1Sei8R2LyFplWimf15fDEJDL',
    savings: 'Save $300/year',
    features: [
      { text: 'Everything in Amplify', included: true, highlight: true },
      { text: 'Virtual Label (10 artists)', included: true },
      { text: 'AI Agent Suite Unlimited', included: true },
      { text: 'Artist Generator Pro', included: true },
      { text: 'Premium Video Unlimited', included: true },
      { text: 'Enterprise Analytics', included: true },
      { text: 'All Platforms Unlimited', included: true },
      { text: 'VIP 24/7 Support', included: true },
      { text: 'Expert Advisors Unlimited', included: true },
    ]
  }
];

const testimonials = [
  {
    quote: "Boostify helped me go from 500 to 50,000 monthly listeners in 3 months!",
    author: "Alex Rivera",
    role: "Indie Artist",
    avatar: "🎤",
    plan: "Elevate"
  },
  {
    quote: "The AI tools are game-changing. My content quality improved 10x overnight.",
    author: "Maya Chen",
    role: "Producer",
    avatar: "🎹",
    plan: "Amplify"
  },
  {
    quote: "Best investment for my music career. The ROI is incredible.",
    author: "Jordan Blake",
    role: "Singer-Songwriter",
    avatar: "🎸",
    plan: "Elevate"
  }
];

const faqs = [
  {
    question: "Can I cancel anytime?",
    answer: "Yes! No contracts, no commitments. Cancel with one click whenever you want."
  },
  {
    question: "Is there a free trial?",
    answer: "Discover plan is free forever. Paid plans come with a 14-day money-back guarantee."
  },
  {
    question: "Can I upgrade or downgrade?",
    answer: "Absolutely! Switch plans anytime. Upgrades are instant, downgrades take effect next billing cycle."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards, PayPal, and Apple Pay through our secure Stripe checkout."
  }
];

export default function PricingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
  const [isYearly, setIsYearly] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const handleSelectPlan = async (plan: typeof plans[0]) => {
    try {
      setProcessingPlanId(plan.id);

      if (!plan.priceId) {
        setLocation('/auth');
        return;
      }

      toast({
        title: "🚀 Redirecting to checkout",
        description: `Setting up ${plan.name} plan...`
      });

      const priceId = isYearly ? plan.yearlyPriceId : plan.priceId;
      
      const response = await fetch('/api/stripe/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId })
      });

      const data = await response.json();
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.message || 'Could not create checkout session');
      }

    } catch (error) {
      logger.error('Error selecting plan:', error);
      toast({
        title: "Error",
        description: "Could not process your request. Please try again.",
        variant: "destructive"
      });
      setProcessingPlanId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[128px] animate-pulse" style={{animationDelay: '2s'}} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-rose-500/5 rounded-full blur-[128px]" />
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:72px_72px]" />
      </div>

      {/* Hero Section */}
      <section className="relative z-10 pt-24 pb-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Floating badge */}
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Badge className="mb-6 px-5 py-2 bg-gradient-to-r from-orange-500/20 to-rose-500/20 text-orange-300 border border-orange-500/30 backdrop-blur-sm text-sm">
                <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
                Simple, transparent pricing • No hidden fees
              </Badge>
            </motion.div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-tight">
              <span className="bg-gradient-to-r from-white via-white to-slate-400 bg-clip-text text-transparent">
                Choose Your
              </span>
              <br />
              <span className="bg-gradient-to-r from-orange-400 via-rose-400 to-purple-400 bg-clip-text text-transparent">
                Success Path
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10">
              From your first release to global domination. Scale at your own pace with plans designed for every stage of your music career.
            </p>

            {/* Billing toggle */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-center gap-4 mb-4"
            >
              <span className={`text-sm font-medium transition-colors ${!isYearly ? 'text-white' : 'text-slate-500'}`}>
                Monthly
              </span>
              <Switch
                checked={isYearly}
                onCheckedChange={setIsYearly}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-orange-500 data-[state=checked]:to-rose-500"
              />
              <span className={`text-sm font-medium transition-colors ${isYearly ? 'text-white' : 'text-slate-500'}`}>
                Yearly
              </span>
              {isYearly && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 animate-pulse">
                  <Gift className="w-3 h-3 mr-1" />
                  2 months free
                </Badge>
              )}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="relative z-10 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 lg:gap-4">
            {plans.map((plan, index) => {
              const Icon = plan.icon;
              const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
              const displayPrice = price === 0 ? '$0' : `$${price.toFixed(2)}`;
              
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`relative ${plan.highlighted ? 'xl:-mt-4 xl:mb-4' : ''}`}
                >
                  {/* Popular badge */}
                  {plan.highlighted && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                      <Badge className="bg-gradient-to-r from-orange-500 to-rose-500 text-white border-0 px-4 py-1 shadow-lg shadow-orange-500/30">
                        {plan.badge}
                      </Badge>
                    </div>
                  )}

                  <Card className={`
                    relative h-full overflow-hidden transition-all duration-500 group
                    ${plan.highlighted 
                      ? 'bg-gradient-to-b from-orange-500/10 via-slate-900/90 to-slate-900/90 border-2 border-orange-500/50 shadow-2xl shadow-orange-500/20' 
                      : 'bg-slate-900/50 border border-slate-800 hover:border-slate-700'
                    }
                    backdrop-blur-xl
                  `}>
                    {/* Glow effect for highlighted */}
                    {plan.highlighted && (
                      <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-transparent pointer-events-none" />
                    )}

                    <div className="relative p-6 lg:p-8">
                      {/* Icon & Name */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`
                          w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} 
                          flex items-center justify-center shadow-lg
                          ${plan.highlighted ? 'shadow-orange-500/30' : ''}
                        `}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">{plan.name}</h3>
                          <p className="text-xs text-slate-500">{plan.tagline}</p>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="mb-6">
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl lg:text-5xl font-black">
                            {price === 0 ? 'Free' : displayPrice.split('.')[0]}
                          </span>
                          {price > 0 && (
                            <>
                              <span className="text-xl font-bold text-slate-400">.{displayPrice.split('.')[1]}</span>
                              <span className="text-slate-500 text-sm ml-1">/{isYearly ? 'year' : 'month'}</span>
                            </>
                          )}
                        </div>
                        {plan.savings && isYearly && price > 0 && (
                          <p className="text-green-400 text-sm font-medium mt-1">
                            {plan.savings}
                          </p>
                        )}
                        <p className="text-slate-400 text-sm mt-2">{plan.description}</p>
                      </div>

                      {/* CTA Button */}
                      <Button 
                        onClick={() => handleSelectPlan(plan)}
                        disabled={processingPlanId === plan.id || plan.comingSoon}
                        className={`
                          w-full h-12 font-semibold text-base transition-all duration-300
                          ${plan.highlighted 
                            ? 'bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50' 
                            : plan.comingSoon
                              ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                              : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 hover:border-slate-600'
                          }
                        `}
                      >
                        {plan.comingSoon ? (
                          <>
                            Coming Soon
                            <Rocket className="w-4 h-4 ml-2" />
                          </>
                        ) : processingPlanId === plan.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : price === 0 ? (
                          <>
                            Start Free
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                          </>
                        ) : (
                          <>
                            Get {plan.name}
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </Button>

                      {/* Features */}
                      <div className="mt-8 space-y-3">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                          What's included
                        </p>
                        {plan.features.map((feature, idx) => (
                          <div 
                            key={idx} 
                            className={`flex items-start gap-3 ${!feature.included ? 'opacity-40' : ''}`}
                          >
                            {feature.included ? (
                              <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${feature.highlight ? 'text-orange-400' : 'text-green-400'}`} />
                            ) : (
                              <X className="w-5 h-5 text-slate-600 flex-shrink-0" />
                            )}
                            <span className={`text-sm ${feature.highlight ? 'text-orange-300 font-medium' : 'text-slate-300'}`}>
                              {feature.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Loved by <span className="text-orange-400">10,000+</span> Artists
            </h2>
            <p className="text-slate-400">Join the community of creators achieving their dreams</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full p-6 bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-all backdrop-blur-sm">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-orange-400 text-orange-400" />
                    ))}
                  </div>
                  <p className="text-slate-300 mb-6 italic">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500/20 to-purple-500/20 flex items-center justify-center text-xl">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{testimonial.author}</p>
                      <p className="text-xs text-slate-500">{testimonial.role} • {testimonial.plan} Plan</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="relative z-10 py-12 px-4 border-y border-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 text-slate-500">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-500" />
              <span className="text-sm">SSL Secured</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span className="text-sm">Cancel Anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-orange-500" />
              <span className="text-sm">14-Day Money Back</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              <span className="text-sm">99.9% Uptime</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-400">Everything you need to know</p>
          </motion.div>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  className={`
                    cursor-pointer transition-all duration-300 border-slate-800 
                    ${expandedFaq === index ? 'bg-slate-800/50' : 'bg-slate-900/30 hover:bg-slate-900/50'}
                  `}
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                >
                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{faq.question}</h3>
                      <ChevronRight className={`w-5 h-5 text-slate-500 transition-transform ${expandedFaq === index ? 'rotate-90' : ''}`} />
                    </div>
                    <AnimatePresence>
                      {expandedFaq === index && (
                        <motion.p
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="text-slate-400 text-sm mt-3 overflow-hidden"
                        >
                          {faq.answer}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden"
          >
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 via-rose-500/20 to-purple-500/20" />
            <div className="absolute inset-0 bg-[#0a0a0f]/80 backdrop-blur-xl" />
            
            <div className="relative p-10 md:p-16 text-center">
              <Badge className="mb-6 bg-white/10 text-white border-white/20">
                <Rocket className="w-4 h-4 mr-2" />
                Limited Time Offer
              </Badge>
              
              <h2 className="text-4xl md:text-5xl font-black mb-6">
                Ready to <span className="bg-gradient-to-r from-orange-400 to-rose-400 bg-clip-text text-transparent">Boost</span> Your Career?
              </h2>
              
              <p className="text-lg text-slate-300 mb-10 max-w-xl mx-auto">
                Join thousands of artists already growing their fanbase with Boostify. Start free today and upgrade when you're ready.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button 
                  onClick={() => setLocation('/auth')}
                  size="lg"
                  className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white px-8 h-14 text-lg font-semibold shadow-lg shadow-orange-500/30"
                >
                  Start Free Today
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button 
                  variant="outline"
                  size="lg"
                  className="border-slate-700 hover:bg-slate-800 h-14 px-8"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  Compare Plans
                </Button>
              </div>

              <p className="text-xs text-slate-500 mt-6">
                No credit card required • Cancel anytime • 14-day money-back guarantee
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
