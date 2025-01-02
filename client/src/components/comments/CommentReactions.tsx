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
  reactions: initialReactions = { like: 0, helpful: 0, insightful: 0 }, 
  badges = [] 
}: CommentReactionsProps) {
  const [userReactions, setUserReactions] = useState<Record<string, boolean>>({});
  const [localReactions, setLocalReactions] = useState(initialReactions);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load user's previous reactions
  useEffect(() => {
    const savedReactions = localStorage.getItem(`reactions_${commentId}`);
    if (savedReactions) {
      setUserReactions(JSON.parse(savedReactions));
    }
  }, [commentId]);

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
    onMutate: ({ type }) => {
      // Optimistically update the UI
      setLocalReactions(prev => ({
        ...prev,
        [type]: (prev[type as keyof typeof prev] || 0) + 1
      }));
    },
    onSuccess: (data, { type }) => {
      // Update local storage
      const newUserReactions = { ...userReactions, [type]: true };
      localStorage.setItem(`reactions_${commentId}`, JSON.stringify(newUserReactions));
      setUserReactions(newUserReactions);

      // Update reaction counts with actual data from server
      setLocalReactions(data.reactions);

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ 
        queryKey: [`/api/data-products/${commentId}/comments`] 
      });
    },
    onError: (error: Error, { type }) => {
      // Revert the optimistic update
      setLocalReactions(prev => ({
        ...prev,
        [type]: (prev[type as keyof typeof prev] || 1) - 1
      }));

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

  const getBadgeIcon = (type: string) => {
    switch (type) {
      case 'quality':
        return <Award className="h-4 w-4" />;
      case 'trending':
        return <TrendingUp className="h-4 w-4" />;
      case 'influential':
        return <Brain className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getBadgeLabel = (type: string) => {
    switch (type) {
      case 'quality':
        return 'High Quality Contribution';
      case 'trending':
        return 'Trending Comment';
      case 'influential':
        return 'Influential Insight';
      default:
        return '';
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className={`gap-1 ${userReactions.like ? 'text-primary hover:text-primary hover:bg-primary/10 dark:text-primary dark:hover:text-primary dark:hover:bg-primary/20' : ''}`}
          onClick={() => handleReaction('like')}
          disabled={userReactions.like}
        >
          <ThumbsUp className="h-4 w-4" />
          <span className="text-sm">{localReactions.like || 0}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className={`gap-1 ${userReactions.helpful ? 'text-primary hover:text-primary hover:bg-primary/10 dark:text-primary dark:hover:text-primary dark:hover:bg-primary/20' : ''}`}
          onClick={() => handleReaction('helpful')}
          disabled={userReactions.helpful}
        >
          <Award className="h-4 w-4" />
          <span className="text-sm">{localReactions.helpful || 0}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className={`gap-1 ${userReactions.insightful ? 'text-primary hover:text-primary hover:bg-primary/10 dark:text-primary dark:hover:text-primary dark:hover:bg-primary/20' : ''}`}
          onClick={() => handleReaction('insightful')}
          disabled={userReactions.insightful}
        >
          <Brain className="h-4 w-4" />
          <span className="text-sm">{localReactions.insightful || 0}</span>
        </Button>
      </div>

      <AnimatePresence>
        {badges?.map((badge) => (
          <motion.div
            key={`${badge.type}-${badge.createdAt}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant="secondary"
                  className="flex items-center gap-1 bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary"
                >
                  {getBadgeIcon(badge.type)}
                  <span className="text-xs">{badge.type}</span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>{getBadgeLabel(badge.type)}</p>
              </TooltipContent>
            </Tooltip>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}