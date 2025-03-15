import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Quote, Star } from 'lucide-react';
import { Badge } from '../../components/ui/badge';

interface Testimonial {
  name: string;
  role: string;
  quote: string;
  image: string;
  stats: {
    label: string;
    value: string;
  }[];
}

const ArtistTestimonials = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const testimonials: Testimonial[] = [
    {
      name: "Sara Rodriguez",
      role: "Independent Singer-Songwriter",
      quote: "Tokenizing my latest EP through Boostify has completely changed my career. I've earned more in the first month than I did in a year on streaming platforms, and the direct connection with my fans is priceless.",
      image: "/assets/freepik__boostify_music_organe_abstract_icon.png", // Placeholder, using the Boostify icon
      stats: [
        { label: "Earnings Increase", value: "580%" },
        { label: "Token Holders", value: "3,200+" },
        { label: "Fan Engagement", value: "12x" }
      ]
    },
    {
      name: "Marcus Bennett",
      role: "Electronic Music Producer",
      quote: "The smart contracts handle everything automatically. I set up my royalty splits once, and now I get paid instantly whenever my music tokens are traded. No more waiting for quarterly payments or chasing down what I'm owed.",
      image: "/assets/freepik__boostify_music_organe_abstract_icon.png", // Placeholder, using the Boostify icon
      stats: [
        { label: "Royalty Rate", value: "15%" },
        { label: "Secondary Sales", value: "$45K+" },
        { label: "New Collaborations", value: "9" }
      ]
    },
    {
      name: "Jade Chen",
      role: "Indie Band Vocalist",
      quote: "Our fans love being part of our musical journey. When they own our tokens, they're not just supporters – they're stakeholders in our success. It's created a community that's deeply invested in helping us grow and succeed.",
      image: "/assets/freepik__boostify_music_organe_abstract_icon.png", // Placeholder, using the Boostify icon 
      stats: [
        { label: "Community Growth", value: "425%" },
        { label: "Tour Funding", value: "$85K" },
        { label: "Album Pre-orders", value: "10x" }
      ]
    }
  ];

  // Auto-rotate testimonials
  useEffect(() => {
    if (isAutoPlaying) {
      intervalRef.current = setInterval(() => {
        setDirection(1);
        setActiveIndex((prev) => (prev + 1) % testimonials.length);
      }, 7000);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAutoPlaying, testimonials.length]);

  const nextTestimonial = () => {
    setIsAutoPlaying(false);
    setDirection(1);
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setIsAutoPlaying(false);
    setDirection(-1);
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  // Variants for smooth slide animation
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0
    })
  };

  return (
    <section className="py-20 bg-gray-800 text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30 px-3 py-1">
            SUCCESS STORIES
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Artists <span className="text-orange-500">thriving</span> with tokenization
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Hear from musicians who have transformed their careers through blockchain technology and direct fan support.
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto">
          {/* Testimonial carousel */}
          <div className="overflow-hidden">
            <div className="relative h-full">
              <motion.div
                key={activeIndex}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="bg-gray-900 rounded-2xl shadow-xl overflow-hidden"
              >
                <div className="flex flex-col md:flex-row">
                  {/* Left column - Quote */}
                  <div className="md:w-2/3 p-8 md:p-12 flex flex-col justify-between">
                    <div>
                      <Quote className="h-12 w-12 text-orange-500/30 mb-6" />
                      <p className="text-xl md:text-2xl italic text-gray-200 mb-8">
                        "{testimonials[activeIndex].quote}"
                      </p>
                      
                      <div className="flex items-center gap-1 text-orange-400 mb-2">
                        <Star className="h-4 w-4 fill-current" />
                        <Star className="h-4 w-4 fill-current" />
                        <Star className="h-4 w-4 fill-current" />
                        <Star className="h-4 w-4 fill-current" />
                        <Star className="h-4 w-4 fill-current" />
                      </div>
                      
                      <div>
                        <h3 className="text-xl font-bold">{testimonials[activeIndex].name}</h3>
                        <p className="text-gray-400">{testimonials[activeIndex].role}</p>
                      </div>
                    </div>
                    
                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-gray-800">
                      {testimonials[activeIndex].stats.map((stat, index) => (
                        <div key={index} className="text-center">
                          <p className="text-2xl md:text-3xl font-bold text-orange-500">{stat.value}</p>
                          <p className="text-sm text-gray-400">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Right column - Image */}
                  <div className="md:w-1/3 bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center p-8">
                    <div className="rounded-full overflow-hidden h-48 w-48 border-4 border-white/30 shadow-xl">
                      <img 
                        src={testimonials[activeIndex].image} 
                        alt={testimonials[activeIndex].name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between items-center mt-8">
            <button 
              onClick={prevTestimonial}
              className="p-2 rounded-full bg-gray-900 hover:bg-orange-500 transition-colors"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            
            {/* Indicator dots */}
            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setIsAutoPlaying(false);
                    setDirection(index > activeIndex ? 1 : -1);
                    setActiveIndex(index);
                  }}
                  className={`w-3 h-3 rounded-full transition-all ${
                    activeIndex === index ? "bg-orange-500 scale-125" : "bg-gray-600 hover:bg-gray-500"
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
            
            <button 
              onClick={nextTestimonial}
              className="p-2 rounded-full bg-gray-900 hover:bg-orange-500 transition-colors"
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ArtistTestimonials;