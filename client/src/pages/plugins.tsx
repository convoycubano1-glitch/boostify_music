import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Puzzle, 
  Newspaper, 
  Zap, 
  Share, 
  Calendar, 
  Settings, 
  RefreshCcw,
  MessageSquare,
  Sparkles,
  BarChart,
  Radio,
  Music,
  Headphones
} from "lucide-react";

import { 
  BeatNewsPlugin, 
  ContentPulsePlugin, 
  SocialSyncPlugin,
  EventBeatPlugin,
  TuneMatchPlugin,
  TrendTrackerPlugin,
  StreamLinkPlugin,
  EchoChatPlugin,
  SEOPulsePlugin
} from "../components/plugins";

export default function PluginsPage() {
  const [activePlugin, setActivePlugin] = useState<string>("beatnews");
  
  const plugins = [
    { 
      id: "beatnews", 
      name: "BeatNews", 
      description: "Automatic music news aggregation and publishing",
      icon: <Newspaper className="h-5 w-5 text-orange-500" />,
      component: <BeatNewsPlugin />
    },
    { 
      id: "contentpulse", 
      name: "ContentPulse", 
      description: "AI-powered content curation and generation",
      icon: <Zap className="h-5 w-5 text-orange-500" />,
      component: <ContentPulsePlugin />
    },
    { 
      id: "socialsync", 
      name: "SocialSync", 
      description: "Social media management and analytics",
      icon: <Share className="h-5 w-5 text-orange-500" />,
      component: <SocialSyncPlugin />
    },
    { 
      id: "eventbeat", 
      name: "EventBeat", 
      description: "Music event tracking and promotion",
      icon: <Calendar className="h-5 w-5 text-orange-500" />,
      component: <EventBeatPlugin />
    },
    { 
      id: "tunematch", 
      name: "TuneMatch", 
      description: "Personalized content recommendations based on user preferences",
      icon: <Headphones className="h-5 w-5 text-orange-500" />,
      component: <TuneMatchPlugin />
    },
    { 
      id: "trendtracker", 
      name: "TrendTracker", 
      description: "Analytics and visualization of content interaction trends",
      icon: <BarChart className="h-5 w-5 text-orange-500" />,
      component: <TrendTrackerPlugin />
    },
    { 
      id: "streamlink", 
      name: "StreamLink", 
      description: "Music streaming platform integration and analytics",
      icon: <Radio className="h-5 w-5 text-orange-500" />,
      component: <StreamLinkPlugin />
    },
    { 
      id: "echochat", 
      name: "EchoChat", 
      description: "User engagement through comments management across all platforms",
      icon: <MessageSquare className="h-5 w-5 text-orange-500" />,
      component: <EchoChatPlugin />
    },
    { 
      id: "seopulse", 
      name: "SEOPulse", 
      description: "Optimize content for search engines and improve visibility",
      icon: <Sparkles className="h-5 w-5 text-orange-500" />,
      component: <SEOPulsePlugin />
    }
  ];
  
  // Find active plugin
  const currentPlugin = plugins.find(p => p.id === activePlugin) || plugins[0];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center">
          <Puzzle className="h-8 w-8 mr-3 text-orange-500" />
          <div>
            <h1 className="text-2xl font-bold">Admin Plugins</h1>
            <p className="text-muted-foreground">Extend your platform with powerful integrated tools</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh All
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Plugin Settings
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <Card className="p-4">
            <div className="space-y-1 mb-4">
              <h3 className="font-medium">Active Plugins</h3>
              <p className="text-xs text-muted-foreground">Select a plugin to configure</p>
            </div>
            
            <div className="space-y-2">
              {plugins.map(plugin => (
                <Button
                  key={plugin.id}
                  variant={activePlugin === plugin.id ? "default" : "ghost"}
                  className={`w-full justify-start ${activePlugin === plugin.id ? "" : "text-muted-foreground"}`}
                  onClick={() => setActivePlugin(plugin.id)}
                >
                  <div className="mr-2">
                    {plugin.icon}
                  </div>
                  <div className="text-left">
                    <div>{plugin.name}</div>
                  </div>
                </Button>
              ))}
              {/* No more plugins in "Coming Soon" section */}
            </div>
          </Card>
        </div>
        
        <div className="md:col-span-3">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b">
              {currentPlugin.icon}
              <div>
                <h2 className="text-xl font-semibold">{currentPlugin.name}</h2>
                <p className="text-muted-foreground">{currentPlugin.description}</p>
              </div>
            </div>
            
            {currentPlugin.component}
          </Card>
        </div>
      </div>
    </div>
  );
}