import { motion } from "framer-motion";
import { Music2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface MusicLoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "subtle" | "premium";
  text?: string;
}

const bars = [1, 2, 3, 4, 5];
const particles = Array.from({ length: 8 }, (_, i) => i + 1);

export function MusicLoadingSpinner({
  className,
  size = "md",
  variant = "default",
  text
}: MusicLoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32"
  };

  const barWidth = size === "sm" ? "w-1" : size === "md" ? "w-1.5" : "w-2";
  const isPremium = variant === "premium";
  
  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <div className={cn("relative flex items-center justify-center", sizeClasses[size])}>
        {/* Outer glow effect */}
        <motion.div
          className={cn(
            "absolute inset-0 rounded-full blur-xl",
            isPremium ? "bg-gradient-to-r from-orange-600/30 to-orange-400/30" : 
                       variant === "default" ? "bg-orange-500/20" : "bg-orange-500/10"
          )}
          animate={{
            scale: [0.8, 1, 0.8],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Inner circle with gradient */}
        <motion.div 
          className={cn(
            "absolute inset-0 rounded-full",
            isPremium ? "bg-gradient-to-br from-background via-orange-950/20 to-background border border-orange-500/30" : 
                       "bg-black/50 border border-orange-500/20"
          )}
          animate={{
            scale: isPremium ? [0.97, 1, 0.97] : [0.95, 1, 0.95],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Spinning arc */}
        {isPremium && (
          <motion.div
            className="absolute inset-0"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          >
            <svg width="100%" height="100%" viewBox="0 0 100 100" className="absolute inset-0">
              <defs>
                <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(249, 115, 22, 0.5)" />
                  <stop offset="50%" stopColor="rgba(249, 115, 22, 0.8)" />
                  <stop offset="100%" stopColor="rgba(249, 115, 22, 0.5)" />
                </linearGradient>
              </defs>
              <circle 
                cx="50" 
                cy="50" 
                r="45" 
                fill="none" 
                stroke="url(#arcGradient)" 
                strokeWidth="2"
                strokeDasharray="75 205"
                strokeLinecap="round"
              />
            </svg>
          </motion.div>
        )}

        {/* Premium particles */}
        {isPremium && particles.map((particle, idx) => (
          <motion.div
            key={`particle-${idx}`}
            className="absolute rounded-full bg-orange-500/50"
            style={{
              width: Math.max(4, Math.random() * 6),
              height: Math.max(4, Math.random() * 6),
            }}
            initial={{
              x: 0,
              y: 0,
              scale: 0,
              opacity: 0
            }}
            animate={{
              x: [0, (Math.random() - 0.5) * 50],
              y: [0, (Math.random() - 0.5) * 50],
              scale: [0, Math.random() + 0.5],
              opacity: [0, 0.8, 0]
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: idx * 0.3,
              ease: "easeOut"
            }}
          />
        ))}

        {/* Central rotating icon */}
        <motion.div
          className={cn(
            "absolute",
            isPremium && "drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]"
          )}
          animate={{
            rotate: 360,
            scale: isPremium ? [0.9, 1.1, 0.9] : [0.95, 1.05, 0.95]
          }}
          transition={{
            rotate: {
              duration: isPremium ? 12 : 8,
              repeat: Infinity,
              ease: "linear"
            },
            scale: {
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }}
        >
          {isPremium ? (
            <div className="relative">
              <Sparkles className={cn(
                "text-orange-400",
                size === "sm" ? "w-7 h-7" : size === "md" ? "w-9 h-9" : "w-12 h-12"
              )} />
              <Music2 className={cn(
                "text-orange-500 absolute inset-0 m-auto",
                size === "sm" ? "w-5 h-5" : size === "md" ? "w-7 h-7" : "w-10 h-10"
              )} />
            </div>
          ) : (
            <Music2 className={cn(
              "text-orange-500",
              size === "sm" ? "w-6 h-6" : size === "md" ? "w-8 h-8" : "w-10 h-10"
            )} />
          )}
        </motion.div>

        {/* Equalizer bars in circular formation */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={cn(
            "relative",
            size === "sm" ? "w-12 h-12" : size === "md" ? "w-16 h-16" : "w-20 h-20"
          )}>
            {bars.map((_, index) => {
              const angle = (index * (360 / bars.length)) * (Math.PI / 180);
              const radius = size === "sm" ? 24 : size === "md" ? 32 : 40;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              
              return (
                <motion.div
                  key={index}
                  className="absolute top-1/2 left-1/2"
                  style={{
                    x: x - (parseInt(barWidth.replace('w-', '')) * 2),
                    y: y - (parseInt(barWidth.replace('w-', '')) * 2),
                    originX: "50%",
                    originY: "50%",
                    rotate: angle * (180 / Math.PI),
                  }}
                >
                  <motion.div
                    className={cn(
                      barWidth, 
                      isPremium 
                        ? "h-4 rounded-full bg-gradient-to-t from-orange-600 to-orange-400" 
                        : "h-3 rounded-full bg-orange-500",
                      variant === "subtle" && "opacity-80"
                    )}
                    animate={{
                      height: isPremium 
                        ? ["6px", `${12 + Math.random() * 12}px`, "6px"] 
                        : ["6px", "14px", "6px"],
                      opacity: isPremium ? [0.6, 1, 0.6] : [0.7, 1, 0.7]
                    }}
                    transition={{
                      duration: 1 + Math.random() * 0.5,
                      repeat: Infinity,
                      delay: index * 0.15,
                      ease: "easeInOut"
                    }}
                  />
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Ripple effect */}
        <motion.div
          className={cn(
            "absolute inset-0 rounded-full",
            isPremium 
              ? "border-2 border-orange-500/40" 
              : variant === "default" 
                ? "border-2 border-orange-500/60" 
                : "border border-orange-500/40"
          )}
          animate={{
            scale: isPremium ? [1, 1.5, 2] : [1, 1.4, 1.8],
            opacity: isPremium ? [0.8, 0.4, 0] : [0.6, 0.3, 0]
          }}
          transition={{
            duration: isPremium ? 2.5 : 2,
            repeat: Infinity,
            ease: "easeOut"
          }}
        />
        
        {/* Second ripple with offset for premium */}
        {isPremium && (
          <motion.div
            className="absolute inset-0 rounded-full border border-orange-400/30"
            animate={{
              scale: [1, 1.7, 2.2],
              opacity: [0.6, 0.2, 0]
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              delay: 0.6,
              ease: "easeOut"
            }}
          />
        )}
      </div>
      
      {/* Optional text label */}
      {text && (
        <motion.div 
          className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <span className={cn(
            "text-sm font-medium",
            isPremium 
              ? "bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-400" 
              : "text-orange-500"
          )}>
            {text}
          </span>
        </motion.div>
      )}
    </div>
  );
}
