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
    <Card className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-orange-500/10 rounded-lg">
          <Brain className="h-6 w-6 text-orange-500" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold">AI Models Configuration</h2>
          <p className="text-sm text-muted-foreground">
            Manage and configure AI models for text, image, voice, and video generation
          </p>
        </div>
      </div>

      <Tabs defaultValue="text" className="space-y-4">
        <TabsList>
          <TabsTrigger value="text">Text Models</TabsTrigger>
          <TabsTrigger value="image">Image Models</TabsTrigger>
          <TabsTrigger value="tts">Voice Models</TabsTrigger>
          <TabsTrigger value="video">Video Models</TabsTrigger>
        </TabsList>

        <TabsContent value="text">
          <div className="space-y-6">
            {textModels.map((model) => (
              <Card key={model.id} className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <Switch
                      checked={model.enabled}
                      onCheckedChange={() => toggleModelStatus(model.id, 'text')}
                    />
                    <div>
                      <h3 className="font-medium">{model.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {model.provider.toUpperCase()} - {model.modelId}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setDefaultTextModel(model.id)}
                    disabled={!model.enabled}
                    className={defaultTextModel === model.id ? "bg-orange-500/10" : ""}
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
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="image">
          <div className="space-y-6">
            {imageModels.map((model) => (
              <Card key={model.id} className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <Switch
                      checked={model.enabled}
                      onCheckedChange={() => toggleModelStatus(model.id, 'image')}
                    />
                    <div>
                      <h3 className="font-medium">{model.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {model.provider.toUpperCase()} - {model.modelId}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setDefaultImageModel(model.id)}
                    disabled={!model.enabled}
                    className={defaultImageModel === model.id ? "bg-orange-500/10" : ""}
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
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tts">
          <div className="space-y-6">
            {ttsModels.map((model) => (
              <Card key={model.id} className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <Switch
                      checked={model.enabled}
                      onCheckedChange={() => toggleModelStatus(model.id, 'tts')}
                    />
                    <div>
                      <h3 className="font-medium">{model.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {model.provider.toUpperCase()} - {model.modelId}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setDefaultTTSModel(model.id)}
                    disabled={!model.enabled}
                    className={defaultTTSModel === model.id ? "bg-orange-500/10" : ""}
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
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="video">
          <div className="space-y-6">
            {videoModels.map((model) => (
              <Card key={model.id} className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <Switch
                      checked={model.enabled}
                      onCheckedChange={() => toggleModelStatus(model.id, 'video')}
                    />
                    <div>
                      <h3 className="font-medium">{model.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {model.provider.toUpperCase()} - {model.modelId}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setDefaultVideoModel(model.id)}
                    disabled={!model.enabled}
                    className={defaultVideoModel === model.id ? "bg-orange-500/10" : ""}
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
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}