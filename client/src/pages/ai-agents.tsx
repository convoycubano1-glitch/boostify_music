import { useState } from "react";
import { Header } from "@/components/layout/header";
import { motion } from "framer-motion";
import { Brain, Database } from "lucide-react";
import { ComposerAgent } from "@/components/ai/composer-agent";
import { VideoDirectorAgent } from "@/components/ai/video-director-agent";
import { MarketingAgent } from "@/components/ai/marketing-agent";
import { SocialMediaAgent } from "@/components/ai/social-media-agent";
import { MerchandiseAgent } from "@/components/ai/merchandise-agent";
import { ManagerAgent } from "@/components/ai/manager-agent";
import { AIDataManager } from "@/components/ai/ai-data-manager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.2 } }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function AIAgentsPage() {
  const [activeTab, setActiveTab] = useState("agents");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-20">
        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 text-center"
          >
            <div className="inline-flex items-center justify-center gap-2 mb-4">
              <div className="p-2 rounded-full bg-orange-500/10">
                <Brain className="h-8 w-8 text-orange-500" />
              </div>
              <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 via-purple-500 to-blue-600">
                AI Agents Orchestra
              </h1>
            </div>
            <p className="text-xl text-muted-foreground mt-2 max-w-2xl mx-auto">
              Power up your music with our team of specialized AI agents
            </p>
          </motion.div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="grid w-full grid-cols-2 gap-4 p-2 bg-muted/50 backdrop-blur-sm rounded-xl border border-orange-500/20">
              <TabsTrigger 
                value="agents" 
                className="gap-3 text-base py-4 px-6 transition-all duration-300 data-[state=active]:bg-orange-500 data-[state=active]:text-white"
              >
                <Brain className="h-5 w-5" />
                <span>AI Agents</span>
              </TabsTrigger>
              <TabsTrigger 
                value="data" 
                className="gap-3 text-base py-4 px-6 transition-all duration-300 data-[state=active]:bg-orange-500 data-[state=active]:text-white"
              >
                <Database className="h-5 w-5" />
                <span>Data & Analytics</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="agents">
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-7xl mx-auto"
              >
                <motion.div variants={item}><ComposerAgent /></motion.div>
                <motion.div variants={item}><VideoDirectorAgent /></motion.div>
                <motion.div variants={item}><MarketingAgent /></motion.div>
                <motion.div variants={item}><SocialMediaAgent /></motion.div>
                <motion.div variants={item}><MerchandiseAgent /></motion.div>
                <motion.div variants={item}><ManagerAgent /></motion.div>
              </motion.div>
            </TabsContent>

            <TabsContent value="data">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <AIDataManager />
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}