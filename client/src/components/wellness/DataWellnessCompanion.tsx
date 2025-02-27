import { useState, useRef, useEffect } from 'react';
import { Bot, MessagesSquare, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Message {
  type: 'bot' | 'user';
  content: string;
  timestamp: Date;
}

const INITIAL_MESSAGE = {
  type: 'bot' as const,
  content: "Hi there! 👋 I'm Dana, your Data Wellness Companion. I'm here to help you maintain healthy and high-quality metadata. Would you like me to give you some tips on improving your data quality?",
  timestamp: new Date(),
};

const SUGGESTED_RESPONSES = [
  "Yes, please give me some tips!",
  "What aspects of my metadata need improvement?",
  "How can I improve data quality?",
  "Show me my data health score",
];

export function DataWellnessCompanion() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    // Focus input when dialog opens
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    try {
      // Add user message
      setMessages(prev => [...prev, {
        type: 'user',
        content,
        timestamp: new Date(),
      }]);

      setIsTyping(true);
      setInputValue(''); // Clear input after sending

      // Send message to API
      const response = await fetch('/api/wellness/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get response');
      }

      const data = await response.json();

      // Add bot response
      setMessages(prev => [...prev, {
        type: 'bot',
        content: data.message,
        timestamp: new Date(),
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: "Conversation Error",
        description: error instanceof Error ? error.message : "Failed to get response",
        variant: "destructive",
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow duration-200 flex items-center justify-center gap-2"
          aria-label="Open Data Wellness Companion"
        >
          <Bot className="h-6 w-6" />
          <span className="sr-only">Chat with Dana</span>
        </Button>
      </DialogTrigger>
      <DialogContent 
        className="sm:max-w-[400px] h-[600px] flex flex-col p-0"
        aria-describedby="chat-description"
      >
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Data Wellness Companion
          </DialogTitle>
          <DialogDescription id="chat-description">
            Your friendly guide to metadata improvements
          </DialogDescription>
        </DialogHeader>

        <ScrollArea 
          ref={scrollAreaRef}
          className="flex-1 p-6 pt-0"
        >
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {messages.map((message, index) => (
                <motion.div
                  key={`${message.timestamp.getTime()}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={cn(
                    "flex gap-2",
                    message.type === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      "rounded-lg p-3 max-w-[80%]",
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground ml-auto'
                        : 'bg-muted'
                    )}
                  >
                    {message.content}
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2"
                >
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>

        <div className="p-4 border-t space-y-4">
          {/* Quick responses */}
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_RESPONSES.map((response) => (
              <Button
                key={response}
                variant="outline"
                size="sm"
                onClick={() => handleSendMessage(response)}
                className="flex-shrink-0"
                disabled={isTyping}
              >
                {response}
              </Button>
            ))}
          </div>

          {/* Custom message input */}
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1"
              disabled={isTyping}
            />
            <Button
              onClick={() => handleSendMessage(inputValue)}
              disabled={isTyping || !inputValue.trim()}
              size="icon"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}