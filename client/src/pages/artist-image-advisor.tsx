import { useState } from "react";
import { Header } from "@/components/layout/header";
import { ImageStyleAdvisor } from "@/components/image-advisor/image-style-advisor";
import { motion } from "framer-motion";

export default function ArtistImageAdvisorPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto px-4 py-12 text-center"
      >
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Artist Image Advisor
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Get personalized style recommendations and visualize your artist image with AI-powered insights
        </p>
      </motion.div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <ImageStyleAdvisor />
      </div>
    </div>
  );
}
