import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Video,
  Play,
  Award,
  Star,
  Calendar,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import * as fal from "@fal-ai/serverless-client";
import { useQuery } from "@tanstack/react-query";

fal.config({
  credentials: import.meta.env.VITE_FAL_API_KEY,
});

interface Director {
  id: string;
  name: string;
  specialty: string;
  experience: string;
  style: string;
  rating: number;
  imageUrl?: string;
}

const generateDirectorImage = async (prompt: string): Promise<string> => {
  try {
    const result = await fal.subscribe("fal-ai/fast-sdxl", {
      input: {
        prompt: `Professional portrait photo of a film director ${prompt}, 4k, highly detailed, professional photography, dramatic lighting`,
        negative_prompt: "cartoon, anime, illustration, painting, drawing, blurry, distorted",
        num_inference_steps: 50,
      },
    });

    if (result?.images?.[0]?.url) {
      return result.images[0].url;
    }
    return '';
  } catch (error) {
    console.error("Error generating image:", error);
    return '';
  }
};

const generateDirectorProfile = async (): Promise<Director> => {
  try {
    //This needs to be replaced with an actual OpenAI or similar LLM call.  
    //This example uses a placeholder to illustrate the structure.  Replace with your actual API call.
    const response = await fetch('YOUR_OPENAI_API_ENDPOINT', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer YOUR_OPENAI_API_KEY` //Replace with your actual API key
      },
      body: JSON.stringify({
        //OpenAI API specific parameters.  Consult OpenAI API documentation.
        "model": "text-davinci-003", //or suitable model
        "prompt": `Generate a creative music video director profile in JSON format with these fields:
        {
          "name": "full name",
          "specialty": "main genre/style",
          "experience": "years and notable achievements",
          "style": "directing style description",
          "rating": "number between 4 and 5"
        }`,
        "max_tokens": 150, // Adjust as needed
      })
    });
    const data = await response.json();
    let profile;
    try {
      profile = JSON.parse(data.choices[0].text || "{}");
    } catch (e) {
      console.error("Error parsing profile:", e);
      profile = {
        name: "John Smith",
        specialty: "Music Video Director",
        experience: "10+ years of experience in music video production",
        style: "Creative and innovative visual storytelling",
        rating: 4.5
      };
    }

    const imageUrl = await generateDirectorImage(`${profile.name}, ${profile.specialty}`);

    return {
      id: Math.random().toString(36).substr(2, 9),
      ...profile,
      imageUrl,
    };
  } catch (error) {
    console.error("Error generating director:", error);
    throw error;
  }
};

export function DirectorsList() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [directors, setDirectors] = useState<Director[]>([]);

  const generateNewDirectors = async () => {
    setIsGenerating(true);
    try {
      const newDirectors = await Promise.all(
        Array(10).fill(null).map(generateDirectorProfile)
      );
      setDirectors((prev) => [...newDirectors, ...prev]);
    } catch (error) {
      console.error("Error generating directors:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
            <Video className="h-6 w-6 text-orange-500" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Featured Directors</h2>
            <p className="text-sm text-muted-foreground">
              Connect with talented music video directors
            </p>
          </div>
        </div>
        <Button
          onClick={generateNewDirectors}
          disabled={isGenerating}
          className="gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating Directors...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Generate Directors
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {directors.map((director) => (
          <motion.div
            key={director.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-lg border hover:bg-orange-500/5 transition-colors"
          >
            <div className="flex items-start gap-4">
              <div className="h-32 w-32 rounded-lg overflow-hidden">
                {director.imageUrl ? (
                  <img
                    src={director.imageUrl}
                    alt={director.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-orange-500/10 flex items-center justify-center">
                    <Award className="h-8 w-8 text-orange-500" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{director.name}</h3>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-orange-500 fill-orange-500" />
                    <span className="text-sm font-medium">{director.rating}</span>
                  </div>
                </div>
                <p className="text-sm font-medium text-orange-500">
                  {director.specialty}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {director.experience}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Style: {director.style}
                </p>
              </div>
            </div>
          </motion.div>
        ))}

        {directors.length === 0 && !isGenerating && (
          <div className="text-center py-8 text-muted-foreground col-span-2">
            <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p>No directors generated yet. Click the button above to start.</p>
          </div>
        )}
      </div>
    </Card>
  );
}