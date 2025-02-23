import { useState } from 'react';
import { chatWithAI } from '@/lib/api/openrouter';
import { BaseAgent } from './base-agent';
import { Brain, Download } from 'lucide-react';

type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export function SuperAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{
    role: 'system',
    content: 'You are a helpful AI assistant for musicians and music industry professionals. Provide clear, practical advice based on industry experience.'
  }]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [plan, setPlan] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const handleOptionSelect = async (option: string) => {
    try {
      setAnswers(prev => ({ ...prev, [currentQuestion]: option }));
      const newMessages = [...messages, { role: 'user', content: option }];
      setMessages(newMessages);
      setIsTyping(true);

      const response = await chatWithAI(newMessages);

      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      setIsTyping(false);
      setCurrentQuestion(prev => prev + 1);
      setProgress(prev => Math.min(100, prev + 20));
    } catch (error) {
      console.error('Error in chat:', error);
      setIsTyping(false);
    }
  };

  const actions = [
    {
      title: "Start Chat",
      description: "Begin a conversation with the AI assistant",
      onClick: () => setIsOpen(true)
    }
  ];

  const theme = {
    primary: 'bg-purple-600',
    secondary: 'bg-purple-100',
    accent: 'text-purple-600'
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
      setMessages([{
        role: 'system',
        content: 'You are a helpful AI assistant for musicians and music industry professionals. Provide clear, practical advice based on industry experience.'
      }]);
      setCurrentQuestion(0);
      setProgress(0);
      setIsGeneratingPlan(false);
      setPlan(null);
      setAnswers({});
    }, 300);
  };


  return (
    <BaseAgent
      name="Super Agent AI"
      description="Your personal AI assistant for music industry guidance"
      icon={Brain}
      actions={actions}
      theme={theme}
      helpText="Hi! I'm your AI assistant for all things music industry related. I can help with career advice, music production, marketing, and more. What would you like to discuss?"
      downloadPlan={downloadPlan}
      handleClose={handleClose}
      isOpen={isOpen}
      messages={messages}
      setMessages={setMessages}
      isTyping={isTyping}
      setIsTyping={setIsTyping}
      progress={progress}
      setProgress={setProgress}
      isGeneratingPlan={isGeneratingPlan}
      setIsGeneratingPlan={setIsGeneratingPlan}
      plan={plan}
      setPlan={setPlan}
      answers={answers}
      setAnswers={setAnswers}
      handleOptionSelect={handleOptionSelect}
      currentQuestion={currentQuestion}
      setCurrentQuestion={setCurrentQuestion}

    />
  );
}