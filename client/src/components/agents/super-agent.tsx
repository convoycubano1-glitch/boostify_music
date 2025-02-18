import { useState } from 'react';
import { Bot, X, Download, Loader2, Star, Sparkles, Music2, BarChart2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { aiAgentChat } from '@/lib/openai';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const questions = [
  {
    question: "What's your current stage as an artist?",
    options: [
      "Just starting out",
      "Released some music",
      "Actively touring",
      "Established artist"
    ]
  },
  {
    question: "How many songs have you released so far?",
    options: [
      "None yet",
      "1-3 songs",
      "4-10 songs",
      "More than 10 songs"
    ]
  },
  {
    question: "Do you have a team?",
    options: [
      "Solo artist, no team",
      "Working with a manager",
      "Have PR and management",
      "Full professional team"
    ]
  },
  {
    question: "What's your monthly budget for music promotion?",
    options: [
      "Under $100",
      "$100-$500",
      "$500-$2000",
      "Over $2000"
    ]
  },
  {
    question: "What are your main goals for the next 6 months?",
    options: [
      "Release first single/EP",
      "Grow streaming numbers",
      "Book more live shows",
      "Build industry connections"
    ]
  },
  {
    question: "Which platforms are you most active on?",
    options: [
      "Instagram/TikTok",
      "YouTube",
      "Spotify/Apple Music",
      "All platforms equally"
    ]
  },
  {
    question: "What genre best describes your music?",
    options: [
      "Pop",
      "Hip-Hop/Rap",
      "Rock/Alternative",
      "Electronic/Dance"
    ]
  }
];

export function SuperAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [plan, setPlan] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const handleOptionSelect = async (option: string) => {
    setAnswers(prev => ({ ...prev, [currentQuestion]: option }));
    const newMessages = [...messages, { role: 'user' as const, content: option }];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      const response = await aiAgentChat([
        { role: 'user' as const, content: questions[currentQuestion].question },
        { role: 'user' as const, content: option }
      ]);
      setMessages([...newMessages, { role: 'assistant' as const, content: response }]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      // Add a generic response when API fails
      setMessages([...newMessages, { 
        role: 'assistant' as const, 
        content: "I've noted your response. Let's continue with the next question." 
      }]);
    } finally {
      setIsTyping(false);
      // Always advance to next question regardless of API response
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setProgress((currentQuestion + 1) * (100 / questions.length));
      } else if (currentQuestion === questions.length - 1) {
        setIsGeneratingPlan(true);
        generateCareerPlan();
      }
    }
  };

  const generateCareerPlan = async () => {
    setProgress(90);
    try {
      const prompt = `Based on the following information about the artist, create a detailed career development plan:
      ${Object.entries(answers).map(([q, a]) => `${questions[parseInt(q)].question}: ${a}`).join('\n')}

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
    } catch (error) {
      console.error('Error generating plan:', error);
      // Provide a default plan when API fails
      setPlan(`Based on your responses, here's a basic career development plan:

1. Immediate Actions (Next 30 days)
- Create social media accounts
- Record and release initial content
- Build basic promotional materials

2. Short-term Goals (3-6 months)
- Grow social media following
- Release new content regularly
- Network with other artists

3. Long-term Strategy (6-12 months)
- Develop consistent brand identity
- Expand to new platforms
- Build sustainable revenue streams

4. Required Resources
- Basic recording equipment
- Social media management tools
- Marketing materials

5. Marketing Strategy
- Focus on organic growth
- Engage with audience regularly
- Collaborate with other artists

6. Revenue Plan
- Music streaming
- Merchandise
- Live performances

7. Key Performance Indicators
- Monthly listener growth
- Social media engagement
- Content release schedule
`);
    } finally {
      setProgress(100);
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
    setTimeout(() => {
      setMessages([]);
      setCurrentQuestion(0);
      setProgress(0);
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
            className="fixed inset-x-4 bottom-24 md:inset-auto md:bottom-24 md:right-6 z-50 md:w-[350px]"
          >
            <Card className="relative shadow-xl border-orange-500/20">
              <div className="p-3">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-orange-500" />
                    <h3 className="text-sm font-medium">Career Development Agent</h3>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleClose}
                    className="hover:bg-orange-500/10 h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-1" />

                  <div className="grid grid-cols-4 gap-1">
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
                          className={`flex flex-col items-center p-1 rounded-lg transition-all duration-300 ${
                            isActive ? 'bg-orange-500/20' : 'bg-background/50'
                          }`}
                        >
                          <item.icon
                            className={`h-4 w-4 mb-1 transition-colors duration-300 ${
                              isActive ? 'text-orange-500' : 'text-muted-foreground'
                            }`}
                          />
                          <span className="text-[10px] text-muted-foreground">{item.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <ScrollArea className="h-[35vh] md:h-[250px] pr-4 mb-3">
                  <div className="space-y-3">
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
                          className={`max-w-[85%] rounded-lg p-2 text-xs ${
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
                          className="bg-orange-500/10 rounded-lg p-2"
                        >
                          <Loader2 className="h-3 w-3 animate-spin" />
                        </motion.div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {!isGeneratingPlan && !plan && (
                  <div className="space-y-3">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs font-medium mb-2"
                    >
                      {questions[currentQuestion].question}
                    </motion.div>
                    <div className="grid grid-cols-1 gap-1.5">
                      {questions[currentQuestion].options.map((option, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-left text-xs hover:bg-orange-500/10 hover:text-orange-500 transition-colors h-8"
                          onClick={() => handleOptionSelect(option)}
                        >
                          {option}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {plan && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3"
                  >
                    <Button
                      size="sm"
                      className="w-full bg-orange-500 hover:bg-orange-600 gap-2 text-xs h-8"
                      onClick={downloadPlan}
                    >
                      <Download className="h-3 w-3" />
                      Download Career Plan
                    </Button>
                  </motion.div>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}