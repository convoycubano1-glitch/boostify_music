import React from 'react';
import { PricingPlans } from '../components/subscription/pricing-plans';
import { 
  ChevronRight, CreditCard, ArrowUp, Sparkle, Shield, Clock, Calendar, 
  CheckCircle, Headphones, HelpCircle, LucideIcon
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";
import { SiVisa, SiMastercard, SiAmericanexpress, SiPaypal } from 'react-icons/si';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => (
  <motion.div
    whileHover={{ y: -5, boxShadow: '0 10px 30px -15px rgba(0, 0, 0, 0.3)' }}
    className="flex flex-col items-center text-center bg-card/40 backdrop-blur-sm p-6 rounded-xl border border-primary/10 hover:border-primary/30 transition-all duration-300"
  >
    <div className="mb-4 bg-primary/10 rounded-full p-3 text-primary">
      {icon}
    </div>
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground text-sm">{description}</p>
  </motion.div>
);

const features = [
  {
    icon: <CreditCard className="h-6 w-6" />,
    title: "Flexible Pricing",
    description: "Choose from monthly or annual plans with a 16% discount for yearly subscriptions."
  },
  {
    icon: <ArrowUp className="h-6 w-6" />,
    title: "Seamless Upgrades",
    description: "Upgrade or downgrade your plan at any time as your needs change."
  },
  {
    icon: <Sparkle className="h-6 w-6" />,
    title: "Premium Features",
    description: "Access exclusive tools designed specifically for music artists."
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: "Secure Payments",
    description: "Your payment information is always protected with industry-standard encryption."
  }
];

interface FAQItemProps {
  question: string;
  answer: string;
}

const FAQItem = ({ question, answer }: FAQItemProps) => (
  <AccordionItem value={question}>
    <AccordionTrigger className="text-left font-semibold hover:no-underline">
      {question}
    </AccordionTrigger>
    <AccordionContent className="text-muted-foreground">
      {answer}
    </AccordionContent>
  </AccordionItem>
);

interface ComparisonFeatureProps {
  feature: string;
  free: boolean;
  basic: boolean;
  pro: boolean;
  premium: boolean;
}

const ComparisonFeature = ({ feature, free, basic, pro, premium }: ComparisonFeatureProps) => (
  <div className="grid grid-cols-5 gap-4 py-2 border-b border-border/30 items-center">
    <div className="text-sm font-medium">{feature}</div>
    <div className="text-center">
      {free ? <CheckCircle className="h-5 w-5 mx-auto text-green-500" /> : <span className="text-muted-foreground">-</span>}
    </div>
    <div className="text-center">
      {basic ? <CheckCircle className="h-5 w-5 mx-auto text-green-500" /> : <span className="text-muted-foreground">-</span>}
    </div>
    <div className="text-center">
      {pro ? <CheckCircle className="h-5 w-5 mx-auto text-green-500" /> : <span className="text-muted-foreground">-</span>}
    </div>
    <div className="text-center">
      {premium ? <CheckCircle className="h-5 w-5 mx-auto text-green-500" /> : <span className="text-muted-foreground">-</span>}
    </div>
  </div>
);

/**
 * Pricing page displays subscription options and pricing plans
 */
export default function PricingPage() {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-zinc-900 text-white">
      {/* Hero section with gradient background */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10 z-0" />
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-orange-500/20 rounded-full filter blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-red-500/20 rounded-full filter blur-3xl" />
        
        <motion.div 
          className="container relative z-10 mx-auto px-4 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-500">
            Find the Perfect Plan for Your Music Career
          </h1>
          <p className="text-xl mb-12 max-w-3xl mx-auto text-white/80">
            Unlock powerful tools and resources designed to elevate your music production and promotion strategy
          </p>
        </motion.div>
      </section>
      
      {/* Pricing plans section */}
      <section className="py-16 relative z-10">
        <div className="container mx-auto px-4">
          <PricingPlans withAnimation={true} />
        </div>
      </section>
      
      {/* Features section */}
      <section className="py-16 relative">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold mb-4">Why Choose Our Premium Plans?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our subscription plans are designed to provide everything you need at each stage of your music career
            </p>
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {features.map((feature, index) => (
              <motion.div key={index} variants={itemVariants}>
                <FeatureCard {...feature} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
      
      {/* Feature comparison table - Shows on larger screens */}
      <section className="py-16 relative hidden lg:block">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold mb-4">Feature Comparison</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Compare plans to find the one that fits your needs
            </p>
          </motion.div>
          
          <motion.div 
            className="bg-card/30 backdrop-blur-sm border border-primary/10 rounded-xl overflow-hidden shadow-xl"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            {/* Header row */}
            <div className="grid grid-cols-5 gap-4 bg-muted/30 p-4 font-medium">
              <div>Feature</div>
              <div className="text-center">Free</div>
              <div className="text-center">Basic</div>
              <div className="text-center">Pro</div>
              <div className="text-center">Premium</div>
            </div>
            
            {/* Feature rows */}
            <div className="p-4">
              <ComparisonFeature 
                feature="Profile Page" 
                free={true} 
                basic={true} 
                pro={true} 
                premium={true} 
              />
              <ComparisonFeature 
                feature="Music Uploads" 
                free={true} 
                basic={true} 
                pro={true} 
                premium={true} 
              />
              <ComparisonFeature 
                feature="Analytics Dashboard" 
                free={true} 
                basic={true} 
                pro={true} 
                premium={true} 
              />
              <ComparisonFeature 
                feature="AI Content Creation" 
                free={false} 
                basic={true} 
                pro={true} 
                premium={true} 
              />
              <ComparisonFeature 
                feature="Strategic Promotion" 
                free={false} 
                basic={true} 
                pro={true} 
                premium={true} 
              />
              <ComparisonFeature 
                feature="Social Media Integration" 
                free={false} 
                basic={true} 
                pro={true} 
                premium={true} 
              />
              <ComparisonFeature 
                feature="Custom Branding" 
                free={false} 
                basic={false} 
                pro={true} 
                premium={true} 
              />
              <ComparisonFeature 
                feature="Priority Support" 
                free={false} 
                basic={false} 
                pro={true} 
                premium={true} 
              />
              <ComparisonFeature 
                feature="Advanced AI Tools" 
                free={false} 
                basic={false} 
                pro={true} 
                premium={true} 
              />
              <ComparisonFeature 
                feature="Enterprise Analytics" 
                free={false} 
                basic={false} 
                pro={false} 
                premium={true} 
              />
              <ComparisonFeature 
                feature="24/7 Premium Support" 
                free={false} 
                basic={false} 
                pro={false} 
                premium={true} 
              />
              <ComparisonFeature 
                feature="Video Production Tools" 
                free={false} 
                basic={false} 
                pro={false} 
                premium={true} 
              />
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* FAQ section */}
      <section className="py-16 relative">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Find answers to common questions about our subscription plans
            </p>
          </motion.div>
          
          <motion.div 
            className="max-w-3xl mx-auto bg-card/30 backdrop-blur-sm rounded-xl border border-primary/10 p-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <Accordion type="single" collapsible className="w-full">
              <FAQItem
                question="What payment methods do you accept?"
                answer="We accept all major credit cards, including Visa, Mastercard, American Express, and PayPal. All payments are processed securely through Stripe."
              />
              <FAQItem
                question="Can I upgrade or downgrade my plan?"
                answer="Yes, you can upgrade your plan at any time, and the new features will be immediately available. When downgrading, the change will take effect at the end of your current billing cycle."
              />
              <FAQItem
                question="Do you offer a free trial?"
                answer="Yes, our free tier allows you to explore core features while deciding which premium plan is right for you. No credit card is required to sign up for the free tier."
              />
              <FAQItem
                question="How do I cancel my subscription?"
                answer="You can cancel your subscription at any time from your account settings page. Your subscription will remain active until the end of your current billing period."
              />
              <FAQItem
                question="What happens to my data if I cancel?"
                answer="Your account will revert to the free tier with limited features. Your music and profile data will remain accessible, but premium features will be disabled. We keep your data for a period of 90 days after cancellation."
              />
              <FAQItem
                question="Is there a long-term contract?"
                answer="No, all our plans are flexible with no long-term commitment required. You can cancel anytime without penalties."
              />
              <FAQItem
                question="Do you offer discounts for music labels or teams?"
                answer="Yes, we offer special rates for music labels and teams. Please contact our sales team at sales@boostify.com for more information."
              />
            </Accordion>
          </motion.div>
        </div>
      </section>
      
      {/* Payment methods and trust indicators */}
      <section className="py-12 border-t border-primary/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h3 className="text-xl font-semibold mb-6">Secure Payment Methods</h3>
            <div className="flex justify-center gap-6 text-white/60">
              <SiVisa className="h-8 w-12" />
              <SiMastercard className="h-8 w-12" />
              <SiAmericanexpress className="h-8 w-12" />
              <SiPaypal className="h-8 w-12" />
            </div>
          </div>
          
          <div className="text-center text-sm text-white/50">
            <p>All payments are secured and encrypted. We never store your complete payment information.</p>
            <p className="mt-2">© 2025 Boostify Music. All rights reserved.</p>
          </div>
        </div>
      </section>
    </div>
  );
}