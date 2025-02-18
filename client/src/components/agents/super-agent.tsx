import { useState, useEffect } from 'react';
import { Bot, X, Download, Send, Loader2, Star, Sparkles, Music2, BarChart2 } from 'lucide-react';
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
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    setAnswers(prev => ({ ...prev, [currentQuestion]: userInput }));
    const newMessages = [...messages, { role: 'user' as const, content: userInput }];
    setMessages(newMessages);
    setUserInput('');
    setIsTyping(true);

    try {
      const response = await aiAgentChat([
        { role: 'user' as const, content: questions[currentQuestion] },
        { role: 'user' as const, content: userInput }
      ]);
      setMessages([...newMessages, { role: 'assistant' as const, content: response }]);

      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setProgress((currentQuestion + 1) * (100 / questions.length));
      } else if (currentQuestion === questions.length - 1 && !isGeneratingPlan) {
        setIsGeneratingPlan(true);
        generateCareerPlan();
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const generateCareerPlan = async () => {
    setProgress(90);
    try {
      const prompt = `Based on the following information about the artist, create a detailed career development plan:
      ${Object.entries(answers).map(([q, a]) => `${questions[parseInt(q)]}: ${a}`).join('\n')}

      Please provide a structured plan with:
      1. Immediate Actions (Next 30 days)
      2. Short-term Goals (3-6 months)
      3. Long-term Strategy (6-12 months)
      4. Required Resources and Tools
      5. Marketing and Promotion Strategy
      6. Revenue Generation Plan
      7. Key Performance Indicators
      `;

      const planResponse = await aiAgentChat([
        { role: 'user' as const, content: prompt }
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

  const handleClose = () => {
    setIsOpen(false);
    // Reset state after animation completes
    setTimeout(() => {
      setMessages([]);
      setCurrentQuestion(0);
      setProgress(0);
      setUserInput('');
      setIsGeneratingPlan(false);
      setPlan(null);
      setAnswers({});
    }, 300);
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
            className="fixed inset-x-4 bottom-24 md:inset-auto md:bottom-24 md:right-6 z-50 md:w-[400px]"
          >
            <Card className="p-4 shadow-xl border-orange-500/20 relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-orange-500" />
                  <h3 className="font-semibold text-sm md:text-base">Career Development Agent</h3>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleClose}
                  className="hover:bg-orange-500/10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[
                    { icon: Star, label: "Profile" },
                    { icon: Music2, label: "Goals" },
                    { icon: BarChart2, label: "Analysis" },
                    { icon: Sparkles, label: "Plan" }
                  ].map((item, index) => {
                    const isActive = progress >= (index + 1) * 25;
                    return (
                      <div
                        key={item.label}
                        className={`flex flex-col items-center p-2 rounded-lg transition-all duration-300 ${
                          isActive ? 'bg-orange-500/20' : 'bg-background/50'
                        }`}
                      >
                        <item.icon
                          className={`h-5 w-5 mb-1 transition-colors duration-300 ${
                            isActive ? 'text-orange-500' : 'text-muted-foreground'
                          }`}
                        />
                        <span className="text-xs text-muted-foreground">{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <ScrollArea className="h-[40vh] md:h-[300px] pr-4 mb-4">
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`max-w-[85%] rounded-lg p-3 text-sm md:text-base ${
                          message.role === 'user'
                            ? 'bg-orange-500 text-white'
                            : 'bg-orange-500/10 text-foreground'
                        }`}
                      >
                        {message.content}
                      </motion.div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <motion.div
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="bg-orange-500/10 rounded-lg p-3"
                      >
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </motion.div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {!isGeneratingPlan && !plan && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm md:text-base text-muted-foreground mb-4 p-3 bg-orange-500/5 rounded-lg border border-orange-500/10"
                >
                  {questions[currentQuestion]}
                </motion.div>
              )}

              {!plan && (
                <div className="flex gap-2">
                  <Textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Type your answer..."
                    className="resize-none text-sm md:text-base"
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

              {plan && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4"
                >
                  <Button
                    className="w-full bg-orange-500 hover:bg-orange-600 gap-2 text-sm md:text-base"
                    onClick={downloadPlan}
                  >
                    <Download className="h-4 w-4" />
                    Download Career Plan
                  </Button>
                </motion.div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}