import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface AnimatedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  icon?: LucideIcon;
  footer?: React.ReactNode;
  variant?: "default" | "premium" | "gradient" | "outlined";
  size?: "sm" | "md" | "lg";
  hoverEffect?: "lift" | "glow" | "scale" | "tilt" | "none";
  imageUrl?: string;
  className?: string;
  children?: React.ReactNode;
}

export function AnimatedCard({
  title,
  description,
  icon: Icon,
  footer,
  variant = "default",
  size = "md",
  hoverEffect = "lift",
  imageUrl,
  className,
  children,
  ...props
}: AnimatedCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Configuraciones de tamaño
  const sizeClasses = {
    sm: "max-w-xs",
    md: "max-w-sm",
    lg: "max-w-md",
  };

  // Configuraciones de animación basadas en el efecto de hover
  const hoverAnimations = {
    lift: {
      rest: { y: 0 },
      hover: { y: -8 },
    },
    glow: {
      rest: { boxShadow: "0 0 0 rgba(249, 115, 22, 0)" },
      hover: { boxShadow: "0 0 30px rgba(249, 115, 22, 0.4)" },
    },
    scale: {
      rest: { scale: 1 },
      hover: { scale: 1.05 },
    },
    tilt: {
      rest: { rotateX: 0, rotateY: 0 },
      hover: { rotateX: 5, rotateY: 5 },
    },
    none: {
      rest: {},
      hover: {},
    },
  };

  // Definir estilos de variante
  const getVariantClasses = () => {
    switch (variant) {
      case "premium":
        return "bg-gradient-to-br from-card/90 via-card to-card/90 border-orange-500/20 shadow-lg";
      case "gradient":
        return "bg-gradient-to-br from-orange-950 via-background to-black border-orange-800/30";
      case "outlined":
        return "bg-black/40 backdrop-blur-sm border-orange-500/30";
      default:
        return "bg-card border-border";
    }
  };

  // Animaciones para partículas (solo para variante premium)
  const particlesAnimation = variant === "premium" && (
    <>
      <motion.div
        className="absolute top-0 right-0 h-2 w-2 rounded-full bg-orange-500/40"
        initial={{ opacity: 0, x: 0, y: 0 }}
        animate={{
          opacity: [0, 0.8, 0],
          x: [-20, -40],
          y: [0, -50],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          repeatType: "loop",
          delay: Math.random() * 2,
        }}
      />
      <motion.div
        className="absolute bottom-0 left-10 h-1 w-1 rounded-full bg-orange-500/30"
        initial={{ opacity: 0, x: 0, y: 0 }}
        animate={{
          opacity: [0, 0.6, 0],
          x: [0, 30],
          y: [0, -40],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          repeatType: "loop",
          delay: Math.random() * 2 + 1,
        }}
      />
      <motion.div
        className="absolute top-10 left-5 h-1.5 w-1.5 rounded-full bg-orange-500/20"
        initial={{ opacity: 0, x: 0, y: 0 }}
        animate={{
          opacity: [0, 0.4, 0],
          x: [0, 20],
          y: [0, -20],
        }}
        transition={{
          duration: 3.2,
          repeat: Infinity,
          repeatType: "loop",
          delay: Math.random() * 2 + 0.5,
        }}
      />
    </>
  );

  return (
    <motion.div
      className={cn("relative overflow-hidden", sizeClasses[size], className)}
      initial="rest"
      animate={isHovered ? "hover" : "rest"}
      variants={hoverAnimations[hoverEffect]}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      transition={{ duration: 0.3, ease: "easeOut" }}
      {...props}
    >
      <Card
        className={cn(
          "overflow-hidden transition-all duration-300",
          getVariantClasses()
        )}
      >
        {/* Partículas animadas para la variante premium */}
        {particlesAnimation}

        {/* Efecto de brillo en hover para variantes premium y gradient */}
        {(variant === "premium" || variant === "gradient") && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-tr from-orange-600/0 via-orange-500/0 to-amber-500/0 opacity-0 mix-blend-overlay"
            animate={{
              opacity: isHovered ? 0.2 : 0,
            }}
            transition={{ duration: 0.3 }}
          />
        )}

        {/* Imagen de fondo si se proporciona */}
        {imageUrl && (
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/30 z-10"
              animate={{
                opacity: isHovered ? 0.75 : 0.85,
              }}
              transition={{ duration: 0.5 }}
            />
            <motion.img
              src={imageUrl}
              alt={title}
              className="absolute inset-0 h-full w-full object-cover"
              animate={{
                scale: isHovered ? 1.1 : 1,
              }}
              transition={{ duration: 0.7 }}
            />
          </div>
        )}

        <div className="relative z-20">
          <CardHeader>
            <div className="flex items-center gap-2">
              {Icon && (
                <motion.div
                  animate={{
                    rotate: isHovered ? [0, 5, 0, -5, 0] : 0,
                    scale: isHovered ? [1, 1.2, 1] : 1,
                  }}
                  transition={{ duration: 0.5 }}
                >
                  <Icon className="h-5 w-5 text-orange-500" />
                </motion.div>
              )}
              <CardTitle
                className={cn(
                  "text-lg",
                  variant === "premium" || variant === "gradient"
                    ? "bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-orange-600"
                    : ""
                )}
              >
                {title}
              </CardTitle>
            </div>
            {description && (
              <CardDescription className="text-muted-foreground">
                {description}
              </CardDescription>
            )}
          </CardHeader>

          <CardContent>{children}</CardContent>

          {footer && (
            <CardFooter className="flex justify-between">
              {footer}
            </CardFooter>
          )}
        </div>
      </Card>
    </motion.div>
  );
}