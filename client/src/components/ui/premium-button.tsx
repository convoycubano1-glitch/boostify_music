import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';

// Extendemos los variants del botón original para añadir nuestras variantes premium
const premiumButtonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-zinc-900 text-white hover:bg-zinc-800",
        outline: "border border-orange-500/30 text-white hover:bg-orange-500/10",
        subtle: "bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800/70 hover:text-white",
        action: "bg-gradient-to-r from-orange-600 to-amber-500 text-white hover:shadow-lg hover:shadow-orange-500/20 transition-all",
        premium: "bg-gradient-to-r from-orange-600 to-amber-500 text-white",
      },
      size: {
        default: "h-10 px-4 py-2 text-sm",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-12 rounded-md px-6 text-base",
        icon: "h-9 w-9",
      },
      glow: {
        true: "shadow-lg shadow-orange-600/20 hover:shadow-xl hover:shadow-orange-600/30",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      glow: false,
    },
  }
);

export interface PremiumButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof premiumButtonVariants> {
  asChild?: boolean;
}

const PremiumButton = forwardRef<HTMLButtonElement, PremiumButtonProps>(
  ({ className, variant, size, glow, children, ...props }, ref) => {
    // Si el botón es premium o action, lo renderizamos con un efecto de gradiente animado
    const isPremium = variant === 'premium' || variant === 'action' || glow;
    
    // Base styling for all buttons
    const baseButtonClass = cn(
      premiumButtonVariants({ variant, size, glow, className })
    );
    
    // Gradient background for premium buttons with animation effect
    if (isPremium) {
      return (
        <motion.button
          ref={ref}
          className={baseButtonClass}
          {...props}
          whileHover={{ 
            scale: 1.03,
            transition: { duration: 0.2 }
          }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Subtle gradient background animation */}
          {glow && (
            <span className="absolute inset-0 rounded-md bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 blur-md opacity-80" />
          )}
          
          {/* Button content */}
          <span className="relative z-10">{children}</span>
        </motion.button>
      );
    }
    
    // Regular buttons without animation effect
    return (
      <Button
        ref={ref}
        className={baseButtonClass}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

PremiumButton.displayName = 'PremiumButton';

export { PremiumButton, premiumButtonVariants };