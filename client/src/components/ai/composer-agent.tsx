// src/components/ai/composer-agent.tsx
import { Music2 } from "lucide-react";
import { BaseAgent, type AgentAction, type AgentTheme } from "./base-agent";
import { falService } from "@/lib/api/fal-service";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { ProgressIndicator } from "./progress-indicator";
import { openRouterService } from "@/lib/api/openrouteraiagents";

interface Step {
  message: string;
  timestamp: Date;
}

export function ComposerAgent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [generatedMusicUrl, setGeneratedMusicUrl] = useState<string | null>(null);
  const [generatedLyrics, setGeneratedLyrics] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState<Step[]>([]);

  const theme: AgentTheme = {
    gradient: "from-purple-600 to-blue-600",
    iconColor: "text-white",
    accentColor: "#7C3AED",
    personality: "🎵 Creative Maestro",
  };

  const simulateThinking = async (customSteps?: string[]) => {
    setIsThinking(true);
    setProgress(0);
    setSteps([]);

    const simulatedSteps = customSteps || [
      "Analyzing musical parameters...",
      "Generating composition structure...",
      "Applying musical theory...",
      "Finalizing arrangement...",
      "Preparing response...",
    ];

    for (let i = 0; i < simulatedSteps.length; i++) {
      setSteps((prev) => [...prev, { message: simulatedSteps[i], timestamp: new Date() }]);
      setProgress((i + 1) * 20);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    setIsThinking(false);
  };

  const createPrompt = (params: any) => {
    return `## ${params.theme}
In ${params.mood} ${params.genre} style,
Tempo set to ${params.tempo} beats per minute,
Following a ${params.structure} structure.

Written in ${params.language}, expressing our theme:
Let the music flow and create our dream.
##`;
  };

  const generateLyrics = async (params: any) => {
    try {
      await simulateThinking([
        "Analyzing theme and mood...",
        "Crafting lyrical structure...",
        "Generating verses...",
        "Adding chorus...",
        "Finalizing lyrics..."
      ]);

      const lyricsPrompt = `Write lyrics for a song with the following parameters:
      - Genre: ${params.genre}
      - Mood: ${params.mood}
      - Theme: ${params.theme}
      - Language: ${params.language}
      - Structure: ${params.structure}

      Please write emotive and meaningful lyrics that capture the essence of the theme.
      Structure the output with clear verse and chorus sections.`;

      const response = await openRouterService.chatWithAgent(
        lyricsPrompt,
        'composer',
        user.uid,
        "You are an expert songwriter with deep knowledge of musical composition and lyrics writing."
      );

      return response;
    } catch (error) {
      console.error("Error generating lyrics:", error);
      throw error;
    }
  };

  const actions: AgentAction[] = [
    {
      name: "Generate musical composition",
      description: "Create a new composition using AI",
      parameters: [
        {
          name: "genre",
          type: "select",
          label: "Musical Genre",
          description: "Select the base musical genre for the composition",
          options: [
            { value: "pop", label: "Pop" },
            { value: "rock", label: "Rock" },
            { value: "hiphop", label: "Hip Hop" },
            { value: "electronic", label: "Electronic" },
            { value: "classical", label: "Classical" },
            { value: "jazz", label: "Jazz" },
          ],
          defaultValue: "pop",
        },
        {
          name: "tempo",
          type: "number",
          label: "Tempo (BPM)",
          description: "Speed of the composition in beats per minute",
          defaultValue: "120",
        },
        {
          name: "mood",
          type: "select",
          label: "Mood",
          description: "Define the emotional character of the composition",
          options: [
            { value: "happy", label: "Happy" },
            { value: "sad", label: "Melancholic" },
            { value: "energetic", label: "Energetic" },
            { value: "calm", label: "Calm" },
            { value: "dark", label: "Dark" },
          ],
          defaultValue: "energetic",
        },
        {
          name: "theme",
          type: "text",
          label: "Theme/Topic",
          description: "Main theme or topic for the lyrics",
          defaultValue: "love",
        },
        {
          name: "language",
          type: "select",
          label: "Language",
          description: "Language for the lyrics",
          options: [
            { value: "english", label: "English" },
            { value: "spanish", label: "Spanish" },
          ],
          defaultValue: "english",
        },
        {
          name: "structure",
          type: "select",
          label: "Song Structure",
          description: "Structure of the composition",
          options: [
            { value: "verse-chorus", label: "Verse-Chorus" },
            { value: "aaba", label: "AABA" },
            { value: "through-composed", label: "Through-composed" },
          ],
          defaultValue: "verse-chorus",
        },
      ],
      action: async (params) => {
        if (!user) {
          toast({
            title: "Authentication Required",
            description: "Please log in to use the AI Composer.",
            variant: "destructive",
          });
          return;
        }

        try {
          setGeneratedMusicUrl(null);
          setGeneratedLyrics(null);

          // Verificar parámetros
          if (!params.genre || !params.tempo || !params.mood || !params.theme || !params.language || !params.structure) {
            throw new Error('Missing required parameters');
          }

          // Primero generamos la letra
          try {
            const lyrics = await generateLyrics(params);
            setGeneratedLyrics(lyrics);
          } catch (error) {
            console.error('Error generating lyrics:', error);
            // Continuamos con la música incluso si fallan las letras
          }

          // Luego generamos la música
          await simulateThinking([
            "Creating musical concept...",
            "Generating melody and harmony...",
            "Applying AI composition...",
            "Processing final audio..."
          ]);

          const prompt = createPrompt(params);
          console.log('Prompt generado:', prompt);

          const response = await falService.generateMusic(
            {
              genre: params.genre,
              tempo: parseInt(params.tempo.toString()),
              mood: params.mood,
              theme: params.theme,
              language: params.language,
              structure: params.structure
            },
            user.uid,
            prompt
          );

          console.log('Respuesta de FAL.AI:', response);

          if (response?.musicUrl) {
            setGeneratedMusicUrl(response.musicUrl);
            toast({
              title: "Content Generated",
              description: "Your musical composition and lyrics have been created successfully.",
            });
          } else {
            throw new Error('No music URL received in response');
          }

        } catch (error) {
          console.error("Error generating music:", error);
          toast({
            title: "Error",
            description: "Failed to generate music. Please try again.",
            variant: "destructive"
          });

          setIsThinking(false);
          setProgress(0);
          setSteps([]);
        }
      }
    }
  ];

  return (
    <BaseAgent
      name="AI Music Composer"
      description="Your creative companion for musical composition"
      icon={Music2}
      actions={actions}
      theme={theme}
      helpText="I'm your Creative Maestro. With years of experience in composition and arrangements, I'll help bring your musical ideas to life using my advanced artificial intelligence. Together, we'll create masterpieces!"
    >
      {(isThinking || steps.length > 0) && (
        <ProgressIndicator
          steps={steps}
          progress={progress}
          isThinking={isThinking}
          isComplete={progress === 100}
        />
      )}
      {generatedLyrics && (
        <div className="mt-4 p-6 bg-black/20 backdrop-blur rounded-lg border border-purple-500/20">
          <h3 className="text-xl font-semibold mb-4 text-purple-400">Generated Lyrics</h3>
          <div className="prose prose-invert max-w-none">
            <pre className="whitespace-pre-wrap text-sm font-mono bg-transparent">{generatedLyrics}</pre>
          </div>
        </div>
      )}
      {generatedMusicUrl && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Generated Music</h3>
          <audio controls src={generatedMusicUrl} className="w-full mb-2">
            Your browser does not support the audio element.
          </audio>
          <a
            href={generatedMusicUrl}
            download="generated_music.mp3"
            className="inline-block px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
          >
            Download Music
          </a>
        </div>
      )}
    </BaseAgent>
  );
}