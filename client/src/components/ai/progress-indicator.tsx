import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

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
  "Analyzing data patterns...",
  "Processing neural networks...",
  "Optimizing algorithms...",
  "Evaluating possibilities...",
  "Calculating outcomes...",
  "Running deep analysis...",
  "Synthesizing insights...",
  "Generating creative solutions..."
];

export function ProgressIndicator({ 
  steps, 
  progress, 
  isComplete = false, 
  isThinking = false 
}: ProgressIndicatorProps) {
  const [currentThinkingMessage, setCurrentThinkingMessage] = useState(0);
  const [displayedMessage, setDisplayedMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (isThinking) {
      const interval = setInterval(() => {
        setCurrentThinkingMessage((prev) => 
          (prev + 1) % thinkingMessages.length
        );
        setIsTyping(true);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isThinking]);

  useEffect(() => {
    if (isThinking) {
      const message = thinkingMessages[currentThinkingMessage];
      let index = 0;
      setDisplayedMessage("");
      setIsTyping(true);

      const typeInterval = setInterval(() => {
        if (index < message.length) {
          setDisplayedMessage((prev) => prev + message[index]);
          index++;
        } else {
          setIsTyping(false);
          clearInterval(typeInterval);
        }
      }, 50);

      return () => clearInterval(typeInterval);
    }
  }, [currentThinkingMessage, isThinking]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-4 p-6 border rounded-xl bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-lg"
    >
      <div className="flex items-center space-x-4">
        <Progress value={progress} className="flex-1" />
        <div className="text-sm font-medium">{progress}%</div>
      </div>

      <ScrollArea className="h-40 rounded-lg border bg-background/50">
        <div className="p-4 space-y-3">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex items-start space-x-3"
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex items-start space-x-3"
            >
              <div className="w-14 flex-shrink-0 text-xs text-muted-foreground">
                {new Date().toLocaleTimeString()}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 text-primary">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm font-medium">
                    {displayedMessage}
                    {isTyping && (
                      <motion.span
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                      >
                        ▌
                      </motion.span>
                    )}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {isComplete && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-start space-x-3"
            >
              <div className="w-14 flex-shrink-0 text-xs text-muted-foreground">
                {new Date().toLocaleTimeString()}
              </div>
              <div className="flex-1">
                <motion.div 
                  className="text-sm font-medium text-green-500"
                  animate={{ 
                    scale: [1, 1.05, 1],
                    opacity: [0, 1]
                  }}
                  transition={{ duration: 0.5 }}
                >
                  Analysis complete! 🎉
                </motion.div>
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>
    </motion.div>
  );
}