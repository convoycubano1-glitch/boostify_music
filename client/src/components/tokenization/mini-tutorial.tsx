import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet, 
  Music, 
  FileText, 
  DollarSign, 
  Share2, 
  Gift, 
  Award
} from 'lucide-react';
import { Badge } from '../../components/ui/badge';

interface TutorialStep {
  icon: JSX.Element;
  title: string;
  description: string;
  color: string;
}

const MiniTutorial = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const steps: TutorialStep[] = [
    {
      icon: <Wallet className="h-10 w-10 text-blue-500" />,
      title: "Connect Your Wallet",
      description: "Start by connecting your Web3 wallet to our platform. We support MetaMask, Coinbase Wallet, WalletConnect and more.",
      color: "bg-blue-500"
    },
    {
      icon: <Music className="h-10 w-10 text-purple-500" />,
      title: "Upload Your Music",
      description: "Upload your audio tracks, album art, and add relevant metadata to prepare your music for tokenization.",
      color: "bg-purple-500"
    },
    {
      icon: <FileText className="h-10 w-10 text-green-500" />,
      title: "Define Smart Contract",
      description: "Choose your tokenization model, set royalty percentages, and configure token supply and distribution.",
      color: "bg-green-500"
    },
    {
      icon: <DollarSign className="h-10 w-10 text-yellow-500" />,
      title: "Set Pricing Strategy",
      description: "Determine token price, release schedule, and special offers for early supporters and super fans.",
      color: "bg-yellow-500"
    },
    {
      icon: <Share2 className="h-10 w-10 text-red-500" />,
      title: "Share With Fans",
      description: "Launch your token to your audience through our marketplace and your own promotional channels.",
      color: "bg-red-500"
    },
    {
      icon: <Gift className="h-10 w-10 text-pink-500" />,
      title: "Offer Exclusive Perks",
      description: "Create exclusive content, experiences, and benefits for token holders to increase value.",
      color: "bg-pink-500"
    },
    {
      icon: <Award className="h-10 w-10 text-orange-500" />,
      title: "Collect Royalties",
      description: "Receive automatic payments whenever your tokens are traded on secondary markets.",
      color: "bg-orange-500"
    }
  ];

  useEffect(() => {
    // Auto-advance steps if auto-play is on
    let interval: NodeJS.Timeout;
    
    if (isAutoPlaying) {
      interval = setInterval(() => {
        setCurrentStep((prev) => (prev + 1) % steps.length);
      }, 3000);
    }
    
    return () => clearInterval(interval);
  }, [isAutoPlaying, steps.length]);

  const handleStepClick = (index: number) => {
    setCurrentStep(index);
    setIsAutoPlaying(false); // Pause auto-play when user manually selects a step
  };

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
  };

  return (
    <section className="py-20 bg-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30 px-3 py-1">
            HOW IT WORKS
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Your <span className="text-orange-500">tokenization</span> journey
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Follow these simple steps to tokenize your music and start earning directly from your fans.
          </p>
        </div>

        <div className="flex flex-col items-center">
          {/* Visual tutorial area */}
          <div className="relative w-full max-w-4xl mx-auto mb-10 h-80 bg-gray-900 rounded-xl overflow-hidden shadow-2xl">
            {/* Step content with animation */}
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 flex flex-col md:flex-row items-center p-8"
            >
              <div className="md:w-1/3 flex justify-center mb-6 md:mb-0">
                <div className={`w-24 h-24 rounded-full ${steps[currentStep].color} flex items-center justify-center shadow-lg`}>
                  {steps[currentStep].icon}
                </div>
              </div>
              <div className="md:w-2/3 text-center md:text-left">
                <h3 className="text-2xl font-bold text-white mb-4">
                  Step {currentStep + 1}: {steps[currentStep].title}
                </h3>
                <p className="text-gray-300 text-lg">
                  {steps[currentStep].description}
                </p>
              </div>
            </motion.div>
            
            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-gray-700">
              <motion.div 
                className="h-full bg-orange-500"
                initial={{ width: `${(currentStep / steps.length) * 100}%` }}
                animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                transition={{ duration: 3 }}
              />
            </div>
          </div>

          {/* Step indicators */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => handleStepClick(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  currentStep === index ? "bg-orange-500 scale-125" : "bg-gray-600 hover:bg-gray-500"
                }`}
                aria-label={`Go to step ${index + 1}`}
              />
            ))}
          </div>

          {/* Auto-play toggle */}
          <button
            onClick={toggleAutoPlay}
            className={`px-4 py-2 rounded-full text-sm transition-colors ${
              isAutoPlaying
                ? "bg-orange-500 text-white hover:bg-orange-600"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            {isAutoPlaying ? "Pause Tutorial" : "Auto-Play Tutorial"}
          </button>
        </div>
      </div>
    </section>
  );
};

export default MiniTutorial;