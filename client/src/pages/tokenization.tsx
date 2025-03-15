import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { 
  Music2, 
  Wallet, 
  TrendingUp, 
  Shield, 
  DollarSign, 
  Globe, 
  User, 
  Users, 
  Share2 
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Footer } from "../components/layout/footer";
import MiniTutorial from "../components/tokenization/mini-tutorial";
import SmartContractVisualizer from "../components/tokenization/smart-contract-visualizer";
import ArtistTestimonials from "../components/tokenization/artist-testimonials";
// No need to import MainNav as navigation is handled by the main layout

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

// UI components specific to tokenization
const TokenizationHero = () => {
  return (
    <div className="relative overflow-hidden bg-black pt-20 pb-24 text-white">
      <div className="absolute inset-0 z-0 opacity-30">
        <video 
          className="h-full w-full object-cover" 
          autoPlay 
          muted 
          loop 
          playsInline
        >
          <source src="/background-video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black"></div>
      </div>

      <div className="container relative z-10 mx-auto px-4 pt-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30 px-4 py-1 text-sm">
              WEB3 TECHNOLOGY
            </Badge>
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-red-500 to-orange-500 leading-tight mb-6">
              Web3 Music Tokenization
            </h1>
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-4 text-xl text-gray-300 max-w-3xl mx-auto"
          >
            Revolutionize the way you monetize your music. Turn your songs into digital assets and connect directly with your fans.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button 
              size="lg"
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
            >
              Get Started
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-orange-500/30 bg-black/30 backdrop-blur-sm text-white hover:bg-black/50"
            >
              Discover Benefits
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

// Benefits section
const BenefitsSection = () => {
  const benefits = [
    {
      icon: <DollarSign className="h-10 w-10 text-orange-500" />,
      title: "Direct Income",
      description: "Receive payments directly from your fans without intermediaries reducing your earnings."
    },
    {
      icon: <User className="h-10 w-10 text-orange-500" />,
      title: "Verifiable Ownership",
      description: "Secure your copyright with immutable and transparent blockchain technology."
    },
    {
      icon: <Users className="h-10 w-10 text-orange-500" />,
      title: "Fan Community",
      description: "Build a community of engaged followers who invest directly in your success."
    },
    {
      icon: <Share2 className="h-10 w-10 text-orange-500" />,
      title: "Automatic Royalties",
      description: "Set up perpetual royalties that pay you automatically with each resale."
    },
    {
      icon: <Shield className="h-10 w-10 text-orange-500" />,
      title: "Rights Protection",
      description: "Protect your creative work with immutable proof of ownership on the blockchain."
    },
    {
      icon: <Globe className="h-10 w-10 text-orange-500" />,
      title: "Global Reach",
      description: "Reach fans and collectors from around the world without geographical restrictions."
    }
  ];

  return (
    <section id="benefits" className="py-20 bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30 px-3 py-1">
            BENEFITS
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Why tokenize your music with <span className="text-orange-500">Boostify</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Music tokenization offers revolutionary advantages for both independent and established artists.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-gray-800 rounded-xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="rounded-full bg-gray-700 w-16 h-16 flex items-center justify-center mb-6">
                {benefit.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{benefit.title}</h3>
              <p className="text-gray-300">{benefit.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// How it works section
const HowItWorksSection = () => {
  const steps = [
    {
      number: 1,
      title: "Connect Your Wallet",
      description: "Connect your digital wallet to securely start the music tokenization process.",
      icon: <Wallet className="h-10 w-10 text-orange-500" />
    },
    {
      number: 2,
      title: "Upload Your Music",
      description: "Upload your audio files, add metadata and configure the royalties you'll receive on each transaction.",
      icon: <Music2 className="h-10 w-10 text-orange-500" />
    },
    {
      number: 3,
      title: "Create Your Token",
      description: "Define your token's offering, pricing, and exclusivity. You can create multiple access tiers.",
      icon: <DollarSign className="h-10 w-10 text-orange-500" />
    },
    {
      number: 4,
      title: "Promote and Sell",
      description: "Share with your audience and start selling your music tokens directly to your fans.",
      icon: <TrendingUp className="h-10 w-10 text-orange-500" />
    }
  ];

  return (
    <section id="how-it-works" className="py-20 bg-gray-800 text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30 px-3 py-1">
            SIMPLE PROCESS
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            How <span className="text-orange-500">tokenization</span> works
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            An intuitive process designed to help you tokenize your music without complications.
          </p>
        </div>

        <div className="flex flex-col space-y-16 max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`flex flex-col md:flex-row ${index % 2 === 1 ? 'md:flex-row-reverse' : ''} items-center gap-6 md:gap-12`}
            >
              <div className="md:w-1/2">
                <div className="relative">
                  <div className="absolute -left-4 -top-4 w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {step.number}
                  </div>
                  <div className="bg-gray-700 rounded-xl p-10 flex items-center justify-center h-64">
                    <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center shadow-lg">
                      {step.icon}
                    </div>
                  </div>
                </div>
              </div>
              <div className="md:w-1/2">
                <h3 className="text-2xl font-bold text-white mb-4">{step.title}</h3>
                <p className="text-gray-300 text-lg">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// FAQ section
const FAQSection = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "What is Web3 music tokenization?",
      answer: "Web3 music tokenization is the process of converting your music rights into unique digital tokens (NFTs) on the blockchain. This allows artists to sell directly to their fans, establish automatic royalties, and create new income models without relying on traditional intermediaries."
    },
    {
      question: "How do artists benefit from tokenization?",
      answer: "Artists receive direct income without intermediaries, earn automatic royalties on each resale, maintain full control over their rights, can monetize their music in innovative ways, and build more direct relationships with their fans by turning them into investors in their career."
    },
    {
      question: "What types of music tokens can I create?",
      answer: "You can create exclusive access tokens for your music, partial ownership tokens that grant royalties, VIP experience tokens like private concerts, membership tokens for exclusive content, and limited collectible tokens that can increase in value."
    },
    {
      question: "Do I need technical knowledge to tokenize my music?",
      answer: "No. Boostify simplifies the entire technical process so you can focus on your creativity. Our intuitive platform handles all the blockchain complexity, allowing you to tokenize your music without specialized technical knowledge."
    },
    {
      question: "How does Boostify ensure the security of my musical assets?",
      answer: "We use cutting-edge blockchain technology with audited smart contracts, decentralized storage for your music files, identity verification systems to protect copyright, and multiple layers of security to protect both artists and buyers."
    },
    {
      question: "Which blockchain does Boostify use for tokenization?",
      answer: "Boostify operates on multiple blockchains, including Ethereum, Polygon, Solana, and Binance Smart Chain, allowing you to choose the one that best suits your needs in terms of transaction costs, speed, and accessibility for your specific audience."
    }
  ];

  const toggleFAQ = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section className="py-20 bg-gray-900 text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/20 px-3 py-1">
            FREQUENTLY ASKED QUESTIONS
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Everything you need to know
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Answers to the most common questions about music tokenization with Boostify.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="mb-4"
            >
              <button
                className={`w-full text-left p-6 rounded-lg ${
                  activeIndex === index ? 'bg-gray-800' : 'bg-gray-800/50'
                } hover:bg-gray-800 transition-colors duration-200`}
                onClick={() => toggleFAQ(index)}
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold">{faq.question}</h3>
                  <span className="text-orange-500 text-xl">
                    {activeIndex === index ? '−' : '+'}
                  </span>
                </div>
                {activeIndex === index && (
                  <p className="mt-4 text-gray-400">
                    {faq.answer}
                  </p>
                )}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Call to Action section
const CTASection = () => {
  return (
    <section className="py-20 bg-gradient-to-r from-orange-500 to-red-500 text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Revolutionize your music career with tokenization
          </h2>
          <p className="text-xl mb-10 text-white/90">
            Join the music industry revolution. Tokenize your music, connect directly with your fans, and maximize your income.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              className="bg-white text-orange-600 hover:bg-gray-100"
            >
              Start Tokenizing
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10"
            >
              Contact Us
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

// Main page component
const TokenizationPage = () => {
  return (
    <div>
      <main>
        <TokenizationHero />
        <BenefitsSection />
        <HowItWorksSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default TokenizationPage;