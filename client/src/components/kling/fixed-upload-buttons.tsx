import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, Camera, Shirt } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface UploadButtonsProps {
  onModelUpload: (imageDataUrl: string) => void;
  onClothingUpload: (imageDataUrl: string) => void;
}

export function FixedUploadButtons({ onModelUpload, onClothingUpload }: UploadButtonsProps) {
  const { toast } = useToast();
  const [modelImage, setModelImage] = useState<string | null>(null);
  const [clothingImage, setClothingImage] = useState<string | null>(null);

  // Handle file upload for model or clothing
  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    imageType: 'model' | 'clothing'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file is an image
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload only image files (JPEG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }
    
    // Read and convert to data URL
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const dataUrl = e.target.result as string;
        
        if (imageType === 'model') {
          setModelImage(dataUrl);
          onModelUpload(dataUrl);
        } else {
          setClothingImage(dataUrl);
          onClothingUpload(dataUrl);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">Upload Images</CardTitle>
        <CardDescription>
          Upload model and clothing images to create a virtual try-on
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <h3 className="text-md font-medium flex items-center gap-2">
              <Camera className="h-4 w-4 text-primary" />
              Model Image
            </h3>
            
            <div className="border border-primary/20 rounded-lg p-4 flex flex-col items-center justify-center gap-4">
              {modelImage && (
                <div className="w-full aspect-[3/4] overflow-hidden rounded-md mb-2">
                  <img 
                    src={modelImage} 
                    alt="Model"
                    className="w-full h-full object-cover" 
                  />
                </div>
              )}
              
              <label className="cursor-pointer w-full">
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'model')}
                />
                <Button className="w-full gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Model Image
                </Button>
              </label>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-md font-medium flex items-center gap-2">
              <Shirt className="h-4 w-4 text-primary" />
              Clothing Image
            </h3>
            
            <div className="border border-primary/20 rounded-lg p-4 flex flex-col items-center justify-center gap-4">
              {clothingImage && (
                <div className="w-full aspect-[3/4] overflow-hidden rounded-md mb-2">
                  <img 
                    src={clothingImage} 
                    alt="Clothing"
                    className="w-full h-full object-cover" 
                  />
                </div>
              )}
              
              <label className="cursor-pointer w-full">
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'clothing')}
                />
                <Button className="w-full gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Clothing Image
                </Button>
              </label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}