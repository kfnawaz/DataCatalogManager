import { useState } from 'react';
import { Bot, MessagesSquare, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
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

interface Message {
  type: 'bot' | 'user';
  content: string;
  timestamp: Date;
}

const INITIAL_MESSAGE = {
  type: 'bot' as const,
  content: "Hi there! 👋 I'm your Data Wellness Companion. I'm here to help you maintain healthy and high-quality metadata. Would you like me to give you some tips on improving your data quality?",
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

  const handleSendMessage = async (content: string) => {
    // Add user message
    setMessages(prev => [...prev, {
      type: 'user',
      content,
      timestamp: new Date(),
    }]);

    setIsTyping(true);

    // Simulate bot response (this will be replaced with actual API call)
    setTimeout(() => {
      setMessages(prev => [...prev, {
        type: 'bot',
        content: "That's a great question! Let me analyze your metadata quality and provide some personalized recommendations...",
        timestamp: new Date(),
      }]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              size="icon"
              className="h-12 w-12 rounded-full shadow-lg"
              aria-label="Open Data Wellness Companion"
            >
              <Bot className="h-6 w-6" />
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

            <ScrollArea className="flex-1 p-6 pt-0">
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

            <div className="p-4 border-t">
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_RESPONSES.map((response) => (
                  <Button
                    key={response}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSendMessage(response)}
                    className="flex-shrink-0"
                  >
                    {response}
                  </Button>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>
    </>
  );
}
