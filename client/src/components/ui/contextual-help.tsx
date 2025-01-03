import * as React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ContextualHelpProps {
  title: string;
  content: string;
  practices?: string[];
  placement?: "top" | "bottom" | "left" | "right";
}

export function ContextualHelp({ 
  title, 
  content, 
  practices = [], 
  placement = "right" 
}: ContextualHelpProps) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            <HelpCircle className="h-4 w-4" />
          </motion.button>
        </TooltipTrigger>
        <TooltipContent side={placement} className="w-80">
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-2"
            >
              <h4 className="font-semibold">{title}</h4>
              <p className="text-sm text-muted-foreground">{content}</p>
              {practices.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs font-medium mb-1">Best Practices:</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {practices.map((practice, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-2"
                      >
                        <span className="block h-1.5 w-1.5 mt-1.5 rounded-full bg-primary" />
                        <span>{practice}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
