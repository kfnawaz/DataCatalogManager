import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ThumbsUp, Award, TrendingUp, Brain } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface CommentReactionsProps {
  commentId: number;
  dataProductId: number;
  reactions?: {
    like: number;
    helpful: number;
    insightful: number;
  };
  badges?: Array<{
    type: string;
    createdAt: string;
  }>;
}

// Function to get or create user identifier
const getUserIdentifier = () => {
  let identifier = localStorage.getItem('userIdentifier');
  if (!identifier) {
    identifier = `user_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
    localStorage.setItem('userIdentifier', identifier);
  }
  return identifier;
};

export default function CommentReactions({
  commentId,
  dataProductId,
  reactions: initialReactions = { like: 0, helpful: 0, insightful: 0 },
  badges = []
}: CommentReactionsProps) {
  const [userReactions, setUserReactions] = useState<Record<string, boolean>>({});
  const [localReactions, setLocalReactions] = useState(initialReactions);
  const [animatingReaction, setAnimatingReaction] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load user's previous reactions
  useEffect(() => {
    const savedReactions = localStorage.getItem(`reactions_${commentId}`);
    if (savedReactions) {
      setUserReactions(JSON.parse(savedReactions));
    }
  }, [commentId]);

  // Update local state when initialReactions change
  useEffect(() => {
    setLocalReactions(initialReactions);
  }, [initialReactions]);

  const reactionMutation = useMutation({
    mutationFn: async ({ type }: { type: string }) => {
      const userIdentifier = getUserIdentifier();
      const response = await fetch(`/api/comments/${commentId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, userIdentifier }),
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.error === "Already reacted") {
          throw new Error("You have already reacted to this comment");
        }
        throw new Error("Failed to add reaction");
      }

      return response.json();
    },
    onSuccess: (data, { type }) => {
      // Update local storage
      const newUserReactions = { ...userReactions, [type]: true };
      localStorage.setItem(`reactions_${commentId}`, JSON.stringify(newUserReactions));
      setUserReactions(newUserReactions);

      // Update reaction counts with actual data from server
      setLocalReactions(data.reactions);

      // Trigger animation
      setAnimatingReaction(type);
      setTimeout(() => setAnimatingReaction(null), 1000);

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: [`/api/data-products/${dataProductId}/comments`]
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to add reaction. Please try again.",
      });
    },
  });

  const handleReaction = (type: string) => {
    if (userReactions[type]) {
      toast({
        variant: "default",
        title: "Already Reacted",
        description: "You have already reacted to this comment.",
      });
      return;
    }
    reactionMutation.mutate({ type });
  };

  // Helper function to get dynamic button classes
  const getButtonClasses = (type: 'like' | 'helpful' | 'insightful') => {
    const hasReacted = userReactions[type];
    const hasCount = localReactions[type] > 0;

    return `
      gap-1 transition-all duration-200 group
      ${hasReacted 
        ? 'text-primary hover:text-primary hover:bg-primary/10 dark:text-primary dark:hover:text-primary dark:hover:bg-primary/20' 
        : hasCount
          ? 'text-foreground hover:text-primary/80 dark:text-white hover:bg-primary/5 dark:hover:bg-primary/10'
          : 'text-foreground hover:text-primary/80 dark:text-white/80 hover:bg-primary/5 dark:hover:bg-primary/10'
      }
    `;
  };

  // Helper function to get icon classes
  const getIconClasses = (type: 'like' | 'helpful' | 'insightful') => {
    const hasCount = localReactions[type] > 0;

    return `
      h-4 w-4 transition-transform duration-200 group-hover:scale-110
      ${hasCount ? 'text-primary dark:text-white' : ''}
    `;
  };

  // Helper function to get count classes
  const getCountClasses = (type: 'like' | 'helpful' | 'insightful') => {
    const hasCount = localReactions[type] > 0;

    return `
      text-sm transition-colors duration-200
      ${hasCount ? 'font-semibold text-primary dark:text-white' : ''}
    `;
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        {(['like', 'helpful', 'insightful'] as const).map((type) => (
          <motion.div
            key={type}
            initial={false}
            animate={{
              scale: animatingReaction === type ? [1, 1.2, 1] : 1,
              rotate: animatingReaction === type ? [0, -10, 10, 0] : 0
            }}
            transition={{
              duration: 0.4,
              type: "spring",
              stiffness: 260,
              damping: 20
            }}
          >
            <Button
              variant="ghost"
              size="sm"
              className={getButtonClasses(type)}
              onClick={() => handleReaction(type)}
              disabled={userReactions[type]}
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 17
                }}
              >
                {type === 'like' && <ThumbsUp className={getIconClasses(type)} />}
                {type === 'helpful' && <Award className={getIconClasses(type)} />}
                {type === 'insightful' && <Brain className={getIconClasses(type)} />}
              </motion.div>
              <motion.span
                key={localReactions[type]}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={getCountClasses(type)}
              >
                {localReactions[type] || 0}
              </motion.span>
            </Button>
          </motion.div>
        ))}
      </div>

      <AnimatePresence mode="sync">
        {badges?.map((badge) => (
          <motion.div
            key={`${badge.type}-${badge.createdAt}`}
            initial={{ opacity: 0, scale: 0.8, x: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 20 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25
            }}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1 bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary"
                >
                  {badge.type === 'quality' && <Award className="h-4 w-4" />}
                  {badge.type === 'trending' && <TrendingUp className="h-4 w-4" />}
                  {badge.type === 'influential' && <Brain className="h-4 w-4" />}
                  <span className="text-xs">{badge.type}</span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {badge.type === 'quality' && 'High Quality Contribution'}
                  {badge.type === 'trending' && 'Trending Comment'}
                  {badge.type === 'influential' && 'Influential Insight'}
                </p>
              </TooltipContent>
            </Tooltip>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}