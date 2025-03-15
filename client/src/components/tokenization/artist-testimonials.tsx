import React from 'react';
import { motion } from 'framer-motion';
import { Star, Quote, ArrowLeft, ArrowRight } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';

/**
 * Artist Testimonials Component
 * 
 * This component showcases success stories from artists who have used
 * the tokenization platform, featuring testimonials with profile images.
 */
const ArtistTestimonials = () => {
  const [activeTestimonial, setActiveTestimonial] = React.useState(0);

  // Artist testimonial data
  const testimonials = [
    {
      name: "Emma Rodriguez",
      role: "Electronic Music Producer",
      avatar: "",
      avatarFallback: "ER",
      testimonial: "Tokenization completely transformed my music career. I went from struggling to monetize my work to earning a consistent income stream directly from my fan community.",
      rating: 5,
      location: "Barcelona, Spain"
    },
    {
      name: "Marcus Chen",
      role: "Indie Singer-Songwriter",
      avatar: "",
      avatarFallback: "MC",
      testimonial: "As an independent artist, I needed a way to fund my next album without a label. With music tokenization, my fans became my investors, and I maintain full creative control.",
      rating: 5,
      location: "Toronto, Canada"
    },
    {
      name: "Sophia Williams",
      role: "Jazz Ensemble Director",
      avatar: "",
      avatarFallback: "SW",
      testimonial: "Our entire catalog is now tokenized, creating a passive income that's helped us tour more and invest in better equipment. The smart contracts make royalty payments seamless.",
      rating: 5,
      location: "New Orleans, USA"
    }
  ];

  const next = () => {
    setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const previous = () => {
    setActiveTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.2,
        duration: 0.6 
      } 
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.4 } 
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.5 } 
    }
  };

  return (
    <section className="py-24 bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30 px-3 py-1">
            SUCCESS STORIES
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Artists <span className="text-orange-500">Transforming</span> Their Careers
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Read how musicians around the world are using tokenization to gain financial independence
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto overflow-hidden">
          {/* Testimonial Cards */}
          <motion.div
            key={activeTestimonial}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={containerVariants}
            className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-8 md:p-12 shadow-xl"
          >
            <div className="flex flex-col md:flex-row gap-8 items-center">
              {/* Left side - Avatar */}
              <motion.div variants={itemVariants} className="md:w-1/3 flex flex-col items-center">
                <div className="relative mb-6">
                  <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-full blur opacity-70"></div>
                  <Avatar className="w-28 h-28 border-4 border-gray-800 relative">
                    <AvatarImage src={testimonials[activeTestimonial].avatar} alt={testimonials[activeTestimonial].name} />
                    <AvatarFallback className="text-3xl bg-orange-500 text-white">
                      {testimonials[activeTestimonial].avatarFallback}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <motion.h3 variants={itemVariants} className="text-xl font-bold text-white">
                  {testimonials[activeTestimonial].name}
                </motion.h3>
                <motion.p variants={itemVariants} className="text-orange-400 text-sm mb-2">
                  {testimonials[activeTestimonial].role}
                </motion.p>
                <motion.p variants={itemVariants} className="text-gray-400 text-sm mb-4">
                  {testimonials[activeTestimonial].location}
                </motion.p>
                
                {/* Star Rating */}
                <motion.div variants={itemVariants} className="flex space-x-1 mb-6">
                  {[...Array(testimonials[activeTestimonial].rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </motion.div>
              </motion.div>
              
              {/* Right side - Testimonial */}
              <motion.div variants={itemVariants} className="md:w-2/3">
                <Quote className="h-10 w-10 text-orange-500/30 mb-4" />
                <motion.blockquote
                  variants={itemVariants}
                  className="text-xl md:text-2xl text-white font-medium italic mb-8 leading-relaxed"
                >
                  "{testimonials[activeTestimonial].testimonial}"
                </motion.blockquote>
                
                <motion.div 
                  variants={itemVariants}
                  className="flex justify-center md:justify-start space-x-4"
                >
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={previous}
                    className="rounded-full border-gray-700 hover:bg-gray-800 hover:text-orange-400"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={next}
                    className="rounded-full border-gray-700 hover:bg-gray-800 hover:text-orange-400"
                  >
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
          
          {/* Navigation Indicators */}
          <div className="flex justify-center mt-6 space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveTestimonial(index)}
                className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                  index === activeTestimonial ? 'bg-orange-500' : 'bg-gray-700'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
        
        <div className="mt-16 text-center">
          <Button 
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
          >
            Join These Success Stories
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ArtistTestimonials;