import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { cva, type VariantProps } from 'class-variance-authority';

// Definimos las variantes para las diferentes apariencias de la tarjeta
const animatedCardVariants = cva(
  "overflow-hidden transition-all",
  {
    variants: {
      variant: {
        default: "bg-zinc-900 text-white border border-zinc-800",
        premium: "bg-gradient-to-br from-zinc-900 to-black border border-orange-800/20 shadow-lg shadow-orange-900/5",
        glow: "bg-zinc-900 border border-orange-500/10 shadow-lg shadow-orange-500/5",
        glass: "bg-zinc-900/80 backdrop-blur-sm border border-zinc-800/50",
        subtle: "bg-black/40 border border-zinc-800/50",
      },
      hover: {
        none: "",
        glow: "hover:shadow-xl hover:shadow-orange-500/10 hover:border-orange-500/30",
        scale: "hover:scale-[1.02] hover:shadow-lg hover:border-zinc-700",
        raise: "hover:translate-y-[-5px] hover:shadow-lg hover:border-zinc-700",
        subtle: "hover:bg-black/60 hover:border-zinc-700/80",
      },
      padding: {
        none: "p-0",
        sm: "p-3",
        md: "p-4",
        lg: "p-6",
      },
    },
    defaultVariants: {
      variant: "default",
      hover: "none",
      padding: "md",
    },
  }
);

export interface AnimatedCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof animatedCardVariants> {
}

const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ className, variant, hover, padding, children, ...props }, ref) => {
    // Para efectos de hover más sofisticados
    const getHoverAnimation = () => {
      if (hover === 'glow') {
        return { 
          boxShadow: '0 0 20px rgba(249, 115, 22, 0.15)',
          borderColor: 'rgba(249, 115, 22, 0.3)',
          transition: { duration: 0.3 }
        };
      }
      if (hover === 'scale') {
        return { 
          scale: 1.02,
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
          transition: { duration: 0.3 }
        };
      }
      if (hover === 'raise') {
        return { 
          y: -5,
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
          transition: { duration: 0.3 }
        };
      }
      if (hover === 'subtle') {
        return { 
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          borderColor: 'rgba(82, 82, 91, 0.8)',
          transition: { duration: 0.3 }
        };
      }
      return {};
    };
    
    // Estilos básicos para la tarjeta basados en las variantes
    const cardClass = cn(
      animatedCardVariants({ variant, hover, padding }),
      className
    );
    
    return (
      <motion.div
        ref={ref}
        className={cardClass}
        whileHover={hover !== 'none' ? getHoverAnimation() : {}}
        transition={{ duration: 0.2 }}
        {...props}
      >
        {/* Efecto de brillo para la variante premium */}
        {variant === 'premium' && (
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-orange-600/5 blur-3xl -z-10"></div>
        )}
        
        {children}
      </motion.div>
    );
  }
);

AnimatedCard.displayName = 'AnimatedCard';

export { AnimatedCard, animatedCardVariants };