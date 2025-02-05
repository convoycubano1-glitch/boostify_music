import { db } from "../client/src/lib/firebase";
import { collection, getDocs, addDoc } from "firebase/firestore";
import * as fal from "@fal-ai/serverless-client";

fal.config({
  credentials: process.env.VITE_FAL_API_KEY,
});

const sampleDirectors = [
  {
    name: "Sofia Ramirez",
    specialty: "Urban & Hip-Hop Visuals",
    experience: "10+ years directing music videos for top urban artists",
    style: "Dynamic street cinematography with bold color grading",
    rating: 4.8
  },
  {
    name: "Marcus Chen",
    specialty: "Alternative & Indie Rock",
    experience: "Award-winning director with 15+ years in music video production",
    style: "Surrealist narratives with experimental techniques",
    rating: 4.9
  },
  {
    name: "Isabella Moretti",
    specialty: "Pop & Contemporary",
    experience: "Former MTV director with global brand collaborations",
    style: "High-fashion aesthetic with cutting-edge visual effects",
    rating: 4.7
  },
  {
    name: "David O'Connor",
    specialty: "Rock & Metal",
    experience: "20+ years specializing in high-energy performance videos",
    style: "Raw, intense cinematography with practical effects",
    rating: 4.6
  },
  {
    name: "Nina Patel",
    specialty: "Electronic & Dance",
    experience: "Pioneer in AI-enhanced music video production",
    style: "Futuristic visuals with immersive digital elements",
    rating: 4.8
  }
];

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

const seedDirectors = async () => {
  try {
    // Check if directors already exist
    const snapshot = await getDocs(collection(db, "directors"));
    if (!snapshot.empty) {
      console.log("Directors already seeded");
      return;
    }

    // Generate and store directors
    for (const director of sampleDirectors) {
      const imageUrl = await generateDirectorImage(`${director.name}, ${director.specialty}`);
      await addDoc(collection(db, "directors"), {
        ...director,
        imageUrl,
        createdAt: new Date(),
      });
      console.log(`Created director: ${director.name}`);
    }

    console.log("Successfully seeded all directors");
  } catch (error) {
    console.error("Error seeding directors:", error);
  }
};

seedDirectors();
