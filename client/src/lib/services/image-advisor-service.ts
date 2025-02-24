import { env } from "@/env";
import { generateId } from "@/lib/utils";

interface ImageAdvice {
  styleAnalysis: string;
  recommendations: string[];
  colorPalette: string[];
  brandingTips: string[];
}

export const imageAdvisorService = {
  async analyzeImage(imageUrl: string): Promise<ImageAdvice> {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.VITE_OPENROUTER_API_KEY}`,
          "HTTP-Referer": window.location.origin,
          "X-Title": "Artist Image Advisor",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "anthropic/claude-3-sonnet",
          messages: [
            {
              role: "system",
              content: `You are an expert image consultant for musicians and artists. Analyze the provided image and create detailed recommendations in JSON format with these exact keys:
              {
                "styleAnalysis": "detailed analysis of current style",
                "recommendations": ["array of specific style recommendations"],
                "colorPalette": ["suggested colors that match the artist's brand"],
                "brandingTips": ["specific branding recommendations"]
              }`
            },
            {
              role: "user",
              content: `Analyze this artist image and provide professional recommendations: ${imageUrl}`
            }
          ],
          temperature: 0.7,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        throw new Error("Failed to analyze image");
      }

      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    } catch (error) {
      console.error("Error analyzing image:", error);
      throw error;
    }
  },

  async generateVisualRecommendations(style: string, genre: string): Promise<string[]> {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.VITE_OPENROUTER_API_KEY}`,
          "HTTP-Referer": window.location.origin,
          "X-Title": "Artist Image Advisor",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "anthropic/claude-3-sonnet",
          messages: [
            {
              role: "system",
              content: "Generate visual style recommendations for musicians based on their genre and desired style. Return an array of specific recommendations."
            },
            {
              role: "user",
              content: `Generate specific visual style recommendations for a ${genre} artist looking to achieve a ${style} style.`
            }
          ],
          temperature: 0.7,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        throw new Error("Failed to generate recommendations");
      }

      const data = await response.json();
      return JSON.parse(data.choices[0].message.content).recommendations;
    } catch (error) {
      console.error("Error generating recommendations:", error);
      throw error;
    }
  }
};

export default imageAdvisorService;
