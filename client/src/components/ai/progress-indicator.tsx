import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ProgressStep {
  message: string;
  timestamp: Date;
}

interface ProgressIndicatorProps {
  steps: ProgressStep[];
  progress: number;
  isComplete?: boolean;
  isThinking?: boolean;
}

const thinkingMessages = [
  "Analyzing request...",
  "Processing data...",
  "Evaluating options...",
  "Computing solutions...",
  "Optimizing results...",
  "Running analysis...",
  "Calculating parameters...",
  "Generating insights..."
];

export function ProgressIndicator({ 
  steps, 
  progress, 
  isComplete = false, 
  isThinking = false 
}: ProgressIndicatorProps) {
  const [currentThinkingMessage, setCurrentThinkingMessage] = useState(0);

  useEffect(() => {
    if (isThinking) {
      const interval = setInterval(() => {
        setCurrentThinkingMessage((prev) => 
          (prev + 1) % thinkingMessages.length
        );
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isThinking]);

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Progress value={progress} className="w-full" />
      <ScrollArea className="h-32 rounded-md border">
        <div className="p-4 space-y-2">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-start space-x-2"
            >
              <div className="w-14 flex-shrink-0 text-xs text-muted-foreground">
                {step.timestamp.toLocaleTimeString()}
              </div>
              <div className="flex-1 text-sm">
                {step.message}
              </div>
            </motion.div>
          ))}
          {isThinking && (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentThinkingMessage}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="flex items-start space-x-2 text-orange-500"
              >
                <div className="w-14 flex-shrink-0 text-xs">
                  {new Date().toLocaleTimeString()}
                </div>
                <div className="flex-1 text-sm font-medium">
                  {thinkingMessages[currentThinkingMessage]}
                  <motion.span
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    ...
                  </motion.span>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
          {isComplete && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start space-x-2 text-green-500"
            >
              <div className="w-14 flex-shrink-0 text-xs">
                {new Date().toLocaleTimeString()}
              </div>
              <div className="flex-1 text-sm font-medium">
                Analysis complete
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}