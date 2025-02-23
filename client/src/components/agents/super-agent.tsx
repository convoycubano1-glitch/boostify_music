import { useState } from 'react';
import { chatWithAI } from '@/lib/api/openrouter';
import { BaseAgent } from './base-agent';
import { Brain } from 'lucide-react';

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

  const handleOptionSelect = async (option: string) => {
    try {
      const newMessage: Message = { role: 'user', content: option };
      setMessages(prev => [...prev, newMessage]);
      setIsTyping(true);

      const response = await chatWithAI([...messages, newMessage]);

      const assistantMessage: Message = { 
        role: 'assistant', 
        content: response 
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
      setCurrentQuestion(prev => prev + 1);
    } catch (error) {
      console.error('Error in chat:', error);
      setIsTyping(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      setMessages([{
        role: 'system',
        content: 'You are a helpful AI assistant for musicians and music industry professionals. Provide clear, practical advice based on industry experience.'
      }]);
      setCurrentQuestion(0);
      setIsTyping(false);
    }, 300);
  };

  return (
    <BaseAgent
      title="Super Agent AI"
      description="Your personal AI assistant for music industry guidance"
      icon={<Brain className="h-6 w-6 text-orange-500" />}
      onActivate={() => setIsOpen(true)}
      onClose={handleClose}
    />
  );
}