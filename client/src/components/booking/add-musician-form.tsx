import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useToast } from "../../hooks/use-toast";
import { generateImageWithFal } from "../../lib/api/fal-ai";
import { Loader2, Image as ImageIcon } from "lucide-react";
import { db } from "../../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import type { MusicianService } from "@/pages/producer-tools";

interface AddMusicianFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AddMusicianForm({ onClose, onSuccess }: AddMusicianFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    instrument: "",
    genres: "",
  });

  const handleGenerateImage = async () => {
    if (!formData.category || !formData.instrument) {
      toast({
        title: "Missing Information",
        description: "Please select a category and instrument before generating an image",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingImage(true);
    try {
      const prompt = `professional portrait of a ${formData.category.toLowerCase()} musician with their ${formData.instrument.toLowerCase()} in a professional studio setting, high-end DSLR camera shot, photorealistic, 4k quality, detailed facial features`;
      
      const result = await generateImageWithFal({
        prompt,
        negativePrompt: "deformed, unrealistic, cartoon, anime, illustration, low quality, blurry",
        imageSize: "landscape_16_9"
      });

      if (result.data && result.data.images && result.data.images[0]) {
        setGeneratedImageUrl(result.data.images[0].url);
        toast({
          title: "Success",
          description: "Profile image generated successfully",
        });
      }
    } catch (error) {
      console.error("Error generating image:", error);
      toast({
        title: "Error",
        description: "Failed to generate profile image",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!generatedImageUrl) {
        throw new Error("Please generate a profile image first");
      }

      const genresList = formData.genres.split(',').map(g => g.trim());

      const musicianData: Partial<MusicianService> = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        instrument: formData.instrument,
        genres: genresList,
        photo: generatedImageUrl,
        rating: 5.0,
        totalReviews: 0,
      };

      // Save to Firestore
      const musiciansRef = collection(db, "musicians");
      await addDoc(musiciansRef, {
        ...musicianData,
        createdAt: serverTimestamp()
      });

      toast({
        title: "Success",
        description: "Musician added successfully",
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error adding musician:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add musician",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const categories = ["Guitar", "Drums", "Piano", "Vocals", "Production", "Other"];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Add New Musician</h3>
        <p className="text-muted-foreground mb-6">
          Fill in the details to add a new musician to the platform
        </p>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="title">Name</Label>
          <Input
            id="title"
            required
            placeholder="e.g., John Smith"
            onChange={(e) => handleChange("title", e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="category">Category</Label>
          <Select required onValueChange={(value) => handleChange("category", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="instrument">Instrument</Label>
          <Input
            id="instrument"
            required
            placeholder="e.g., Electric Guitar, Drums, Piano"
            onChange={(e) => handleChange("instrument", e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="price">Price per Session ($)</Label>
          <Input
            id="price"
            type="number"
            required
            min="0"
            step="0.01"
            placeholder="e.g., 120"
            onChange={(e) => handleChange("price", e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="genres">Genres (comma-separated)</Label>
          <Input
            id="genres"
            required
            placeholder="e.g., Rock, Blues, Jazz"
            onChange={(e) => handleChange("genres", e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            required
            placeholder="Describe the musician's experience and expertise..."
            onChange={(e) => handleChange("description", e.target.value)}
          />
        </div>

        {/* Image Generation Section */}
        <div className="space-y-4 pt-4">
          <Button
            type="button"
            onClick={handleGenerateImage}
            disabled={isGeneratingImage || !formData.category || !formData.instrument}
            variant="secondary"
            className="w-full"
          >
            {isGeneratingImage ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Profile Image...
              </>
            ) : (
              <>
                <ImageIcon className="mr-2 h-4 w-4" />
                Generate Profile Image
              </>
            )}
          </Button>

          {generatedImageUrl && (
            <div className="aspect-video relative rounded-lg overflow-hidden border">
              <img
                src={generatedImageUrl}
                alt="Generated profile"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting || !generatedImageUrl} 
          className="bg-primary"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding Musician...
            </>
          ) : (
            "Add Musician"
          )}
        </Button>
      </div>
    </form>
  );
}
