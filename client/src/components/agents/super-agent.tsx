import { useState, useEffect } from 'react';
import { Bot, X, Download, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { aiAgentChat } from '@/lib/openai';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const questions = [
  "What's your current stage as an artist? (e.g., just starting, have released music, touring)",
  "How many songs have you released so far?",
  "Do you have a team? (manager, PR, etc.)",
  "What's your monthly budget for music promotion?",
  "What are your main goals for the next 6 months?",
  "Which platforms are you most active on?",
  "What genre best describes your music?",
];

export function SuperAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [progress, setProgress] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [plan, setPlan] = useState<string | null>(null);

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    // Add user message
    const newMessages = [...messages, { role: 'user', content: userInput }];
    setMessages(newMessages);
    setUserInput('');
    setIsTyping(true);

    try {
      // Get AI response
      const response = await aiAgentChat(newMessages);
      setMessages([...newMessages, { role: 'assistant', content: response }]);

      // Move to next question if available
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setProgress((currentQuestion + 1) * (100 / questions.length));
      } else if (currentQuestion === questions.length - 1 && !isGeneratingPlan) {
        setIsGeneratingPlan(true);
        generateCareerPlan(newMessages);
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const generateCareerPlan = async (chatHistory: Message[]) => {
    setProgress(90);
    try {
      const planResponse = await aiAgentChat([
        ...chatHistory,
        { role: 'user', content: 'Based on my answers, please create a detailed career development plan' }
      ]);
      setPlan(planResponse);
      setProgress(100);
    } catch (error) {
      console.error('Error generating plan:', error);
    }
  };

  const downloadPlan = () => {
    if (!plan) return;
    const blob = new Blob([plan], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'career-development-plan.txt';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Button
          size="lg"
          className="rounded-full w-14 h-14 bg-orange-500 hover:bg-orange-600 shadow-lg"
          onClick={() => setIsOpen(true)}
        >
          <Bot className="h-6 w-6" />
        </Button>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 right-6 z-50 w-[400px]"
          >
            <Card className="p-4 shadow-xl border-orange-500/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-orange-500" />
                  <h3 className="font-semibold">Career Development Agent</h3>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                {/* Chat Area */}
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-4">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            message.role === 'user'
                              ? 'bg-orange-500 text-white'
                              : 'bg-orange-500/10 text-foreground'
                          }`}
                        >
                          {message.content}
                        </div>
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-orange-500/10 rounded-lg p-3">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Current Question Display */}
                {!isGeneratingPlan && !plan && (
                  <div className="text-sm text-muted-foreground">
                    {questions[currentQuestion]}
                  </div>
                )}

                {/* Input Area */}
                {!plan && (
                  <div className="flex gap-2">
                    <Textarea
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      placeholder="Type your answer..."
                      className="resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button
                      className="bg-orange-500 hover:bg-orange-600"
                      onClick={handleSendMessage}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Download Plan Button */}
                {plan && (
                  <Button
                    className="w-full bg-orange-500 hover:bg-orange-600"
                    onClick={downloadPlan}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Career Plan
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
