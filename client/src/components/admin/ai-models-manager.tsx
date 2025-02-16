import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { useAIModelsStore } from "@/store/ai-models-store";
import { Brain, Image as ImageIcon, Music2, Video } from "lucide-react";
import type { TextModel, ImageModel, TTSModel, VideoModel } from "@/types/ai-models";
import { motion } from "framer-motion";

const modelCardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 }
  }
};

export function AIModelsManager() {
  const {
    textModels,
    imageModels,
    ttsModels,
    videoModels,
    defaultTextModel,
    defaultImageModel,
    defaultTTSModel,
    defaultVideoModel,
    updateTextModel,
    updateImageModel,
    updateTTSModel,
    updateVideoModel,
    setDefaultTextModel,
    setDefaultImageModel,
    setDefaultTTSModel,
    setDefaultVideoModel,
    toggleModelStatus,
  } = useAIModelsStore();

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-2 sm:p-3 bg-orange-500/10 rounded-lg">
          <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold">AI Models Configuration</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Manage and configure AI models for text, image, voice, and video generation
          </p>
        </div>
      </div>

      <Tabs defaultValue="text" className="space-y-4">
        <TabsList className="flex flex-wrap gap-2 sm:flex-nowrap">
          <TabsTrigger value="text" className="flex-1">
            <Brain className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Text</span>
          </TabsTrigger>
          <TabsTrigger value="image" className="flex-1">
            <ImageIcon className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Image</span>
          </TabsTrigger>
          <TabsTrigger value="tts" className="flex-1">
            <Music2 className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Voice</span>
          </TabsTrigger>
          <TabsTrigger value="video" className="flex-1">
            <Video className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Video</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="text">
          <div className="space-y-4 sm:space-y-6">
            {textModels.map((model, index) => (
              <motion.div
                key={model.id}
                variants={modelCardVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-4">
                      <Switch
                        checked={model.enabled}
                        onCheckedChange={() => toggleModelStatus(model.id, 'text')}
                      />
                      <div>
                        <h3 className="font-medium">{model.name}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {model.provider.toUpperCase()} - {model.modelId}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setDefaultTextModel(model.id)}
                      disabled={!model.enabled}
                      className={`w-full sm:w-auto ${defaultTextModel === model.id ? "bg-orange-500/10" : ""}`}
                    >
                      {defaultTextModel === model.id ? "Default Model" : "Set as Default"}
                    </Button>
                  </div>

                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label>Temperature</Label>
                      <Slider
                        value={[model.temperature]}
                        min={0}
                        max={1}
                        step={0.1}
                        onValueChange={([value]) =>
                          updateTextModel({ ...model, temperature: value })
                        }
                        disabled={!model.enabled}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Max Tokens</Label>
                      <Input
                        type="number"
                        value={model.maxTokens}
                        onChange={(e) =>
                          updateTextModel({
                            ...model,
                            maxTokens: parseInt(e.target.value),
                          })
                        }
                        disabled={!model.enabled}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>API Key (Optional)</Label>
                      <Input
                        type="password"
                        value={model.apiKey || ""}
                        onChange={(e) =>
                          updateTextModel({ ...model, apiKey: e.target.value })
                        }
                        placeholder="Enter API key if different from default"
                        disabled={!model.enabled}
                        className="w-full"
                      />
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="image">
          <div className="space-y-4 sm:space-y-6">
            {imageModels.map((model, index) => (
              <motion.div
                key={model.id}
                variants={modelCardVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-4">
                      <Switch
                        checked={model.enabled}
                        onCheckedChange={() => toggleModelStatus(model.id, 'image')}
                      />
                      <div>
                        <h3 className="font-medium">{model.name}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {model.provider.toUpperCase()} - {model.modelId}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setDefaultImageModel(model.id)}
                      disabled={!model.enabled}
                      className={`w-full sm:w-auto ${defaultImageModel === model.id ? "bg-orange-500/10" : ""}`}
                    >
                      {defaultImageModel === model.id ? "Default Model" : "Set as Default"}
                    </Button>
                  </div>

                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label>Max Resolution</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          type="number"
                          value={model.maxResolution.width}
                          onChange={(e) =>
                            updateImageModel({
                              ...model,
                              maxResolution: {
                                ...model.maxResolution,
                                width: parseInt(e.target.value),
                              },
                            })
                          }
                          placeholder="Width"
                          disabled={!model.enabled}
                          className="w-full"
                        />
                        <Input
                          type="number"
                          value={model.maxResolution.height}
                          onChange={(e) =>
                            updateImageModel({
                              ...model,
                              maxResolution: {
                                ...model.maxResolution,
                                height: parseInt(e.target.value),
                              },
                            })
                          }
                          placeholder="Height"
                          disabled={!model.enabled}
                          className="w-full"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>API Key (Optional)</Label>
                      <Input
                        type="password"
                        value={model.apiKey || ""}
                        onChange={(e) =>
                          updateImageModel({ ...model, apiKey: e.target.value })
                        }
                        placeholder="Enter API key if different from default"
                        disabled={!model.enabled}
                        className="w-full"
                      />
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tts">
          <div className="space-y-4 sm:space-y-6">
            {ttsModels.map((model, index) => (
              <motion.div
                key={model.id}
                variants={modelCardVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-4">
                      <Switch
                        checked={model.enabled}
                        onCheckedChange={() => toggleModelStatus(model.id, 'tts')}
                      />
                      <div>
                        <h3 className="font-medium">{model.name}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {model.provider.toUpperCase()} - {model.modelId}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setDefaultTTSModel(model.id)}
                      disabled={!model.enabled}
                      className={`w-full sm:w-auto ${defaultTTSModel === model.id ? "bg-orange-500/10" : ""}`}
                    >
                      {defaultTTSModel === model.id ? "Default Model" : "Set as Default"}
                    </Button>
                  </div>

                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label>Features</Label>
                      <div className="flex flex-wrap gap-2">
                        {model.features.map((feature, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-orange-500/10 rounded text-sm"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>API Key (Optional)</Label>
                      <Input
                        type="password"
                        value={model.apiKey || ""}
                        onChange={(e) =>
                          updateTTSModel({ ...model, apiKey: e.target.value })
                        }
                        placeholder="Enter API key if different from default"
                        disabled={!model.enabled}
                        className="w-full"
                      />
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="video">
          <div className="space-y-4 sm:space-y-6">
            {videoModels.map((model, index) => (
              <motion.div
                key={model.id}
                variants={modelCardVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-4">
                      <Switch
                        checked={model.enabled}
                        onCheckedChange={() => toggleModelStatus(model.id, 'video')}
                      />
                      <div>
                        <h3 className="font-medium">{model.name}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {model.provider.toUpperCase()} - {model.modelId}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setDefaultVideoModel(model.id)}
                      disabled={!model.enabled}
                      className={`w-full sm:w-auto ${defaultVideoModel === model.id ? "bg-orange-500/10" : ""}`}
                    >
                      {defaultVideoModel === model.id ? "Default Model" : "Set as Default"}
                    </Button>
                  </div>

                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label>Max Duration (seconds)</Label>
                      <Input
                        type="number"
                        value={model.maxDuration}
                        onChange={(e) =>
                          updateVideoModel({
                            ...model,
                            maxDuration: parseInt(e.target.value),
                          })
                        }
                        disabled={!model.enabled}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>API Key (Optional)</Label>
                      <Input
                        type="password"
                        value={model.apiKey || ""}
                        onChange={(e) =>
                          updateVideoModel({ ...model, apiKey: e.target.value })
                        }
                        placeholder="Enter API key if different from default"
                        disabled={!model.enabled}
                        className="w-full"
                      />
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}