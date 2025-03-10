import React, { forwardRef, ReactNode } from "react";
import { motion } from "framer-motion";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Sparkles, Loader2 } from "lucide-react";

// Definición de variantes usando CVA
const premiumButtonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background relative overflow-hidden group",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        vibrant: "bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white",
        glow: "bg-black border border-orange-500/20 text-orange-500 hover:bg-black/80 hover:border-orange-500/50 hover:text-orange-400",
        outline: "border border-orange-500/30 text-orange-500 hover:border-orange-500/80 hover:bg-orange-500/5",
        ghost: "text-orange-500 hover:bg-orange-500/10",
        premium: "bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md hover:from-orange-700 hover:to-orange-600 hover:shadow-lg",
      },
      size: {
        sm: "h-9 px-3 py-2 text-xs",
        md: "h-10 px-4 py-2",
        lg: "h-11 px-6 py-2.5 text-base",
        xl: "h-12 px-8 py-3 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

// Tipos de props extendiendo Button y CVA
export interface PremiumButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof premiumButtonVariants> {
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  isLoading?: boolean;
  loadingText?: string;
  isSparkle?: boolean;
  sparkleAnimations?: boolean;
}

// Componente de botón premium
export const PremiumButton = forwardRef<HTMLButtonElement, PremiumButtonProps>(
  (
    {
      className,
      variant,
      size,
      children,
      leftIcon,
      rightIcon,
      isLoading = false,
      loadingText,
      isSparkle = false,
      sparkleAnimations = false,
      ...props
    },
    ref
  ) => {
    // Renderizar contenido condicional basado en estado de carga
    const renderContent = () => {
      if (isLoading) {
        return (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {loadingText || children}
          </>
        );
      }

      return (
        <>
          {leftIcon && <span className="mr-2">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="ml-2">{rightIcon}</span>}
          {isSparkle && (
            <Sparkles className="ml-2 h-4 w-4 text-white animate-pulse" />
          )}
        </>
      );
    };

    // Efectos de brillo y partícula para el botón premium
    const renderPremiumEffects = () => {
      if (variant === "premium" || variant === "vibrant") {
        return (
          <>
            {/* Efecto de brillo en hover */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100"
              animate={{
                x: ["0%", "100%"],
                opacity: [0, 0.1, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatType: "loop",
                ease: "easeInOut",
              }}
            />
            
            {/* Efectos de partículas para variante premium con animaciones habilitadas */}
            {sparkleAnimations && (
              <>
                <motion.div
                  className="absolute top-1/3 left-1/4 h-1 w-1 rounded-full bg-orange-200 opacity-0"
                  animate={{
                    y: [0, -10],
                    opacity: [0, 0.6, 0],
                    scale: [0.5, 1.2, 0.5],
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    repeatType: "loop",
                    repeatDelay: 1.5,
                  }}
                />
                <motion.div
                  className="absolute top-1/2 right-1/4 h-1.5 w-1.5 rounded-full bg-orange-200 opacity-0"
                  animate={{
                    y: [0, -15],
                    opacity: [0, 0.7, 0],
                    scale: [0.8, 1.1, 0.8],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    repeatType: "loop",
                    repeatDelay: 1,
                  }}
                />
              </>
            )}
          </>
        );
      }
      
      return null;
    };

    return (
      <motion.button
        className={cn(premiumButtonVariants({ variant, size, className }))}
        ref={ref}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.1 }}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {renderPremiumEffects()}
        {renderContent()}
      </motion.button>
    );
  }
);