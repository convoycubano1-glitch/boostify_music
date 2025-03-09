import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { EnglishVirtualTryOn } from './english-virtual-tryon';
import { FixedUploadButtons } from './fixed-upload-buttons';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

/**
 * This component wraps the EnglishVirtualTryOn component with the 
 * new fixed upload buttons, solving the visibility problem.
 */
export function EnglishVirtualTryOnWrapper() {
  const [modelImage, setModelImage] = useState<string | null>(null);
  const [clothingImage, setClothingImage] = useState<string | null>(null);
  const [showOriginalComponent, setShowOriginalComponent] = useState(false);
  const { toast } = useToast();

  // Handle model image upload from the fixed buttons
  const handleModelUpload = (imageDataUrl: string) => {
    console.log("Model image uploaded via fixed buttons");
    setModelImage(imageDataUrl);
    
    // Show success message
    toast({
      title: "Model Image Uploaded",
      description: "Your model image has been successfully uploaded.",
    });
  };

  // Handle clothing image upload from the fixed buttons
  const handleClothingUpload = (imageDataUrl: string) => {
    console.log("Clothing image uploaded via fixed buttons");
    setClothingImage(imageDataUrl);
    
    // Show success message
    toast({
      title: "Clothing Image Uploaded",
      description: "Your clothing image has been successfully uploaded.",
    });
  };

  // Start the try-on process with the uploaded images
  const handleStartTryOn = () => {
    if (!modelImage || !clothingImage) {
      toast({
        title: "Missing images",
        description: "Please upload both a model and clothing image to continue",
        variant: "destructive",
      });
      return;
    }
    
    // Show the original component with our uploaded images
    setShowOriginalComponent(true);
  };

  return (
    <div className="space-y-6">
      {/* Fixed Upload Buttons - Always visible and easier to use */}
      <FixedUploadButtons 
        onModelUpload={handleModelUpload}
        onClothingUpload={handleClothingUpload}
      />
      
      {/* Show start button when both images are uploaded */}
      {modelImage && clothingImage && !showOriginalComponent && (
        <div className="flex justify-center">
          <Button 
            onClick={handleStartTryOn}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg"
          >
            <Sparkles className="mr-2 h-5 w-5" />
            Start Virtual Try-On
          </Button>
        </div>
      )}
      
      {/* Show the original component when ready */}
      {showOriginalComponent && (
        <EnglishVirtualTryOn 
          initialModelImage={modelImage || ""}
          initialClothingImage={clothingImage || ""}
        />
      )}
    </div>
  );
}