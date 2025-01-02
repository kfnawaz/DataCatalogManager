import { useState } from "react";
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

export default function CommentReactions({ 
  commentId, 
  reactions: initialReactions = { like: 0, helpful: 0, insightful: 0 }, 
  badges = [] 
}: CommentReactionsProps) {
  const [userReactions, setUserReactions] = useState<Record<string, boolean>>({});
  const [localReactions, setLocalReactions] = useState(initialReactions);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const reactionMutation = useMutation({
    mutationFn: async ({ type }: { type: string }) => {
      const response = await fetch(`/api/comments/${commentId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });

      if (!response.ok) {
        throw new Error("Failed to add reaction");
      }

      return response.json();
    },
    onMutate: ({ type }) => {
      // Optimistically update the local state
      setLocalReactions(prev => ({
        ...prev,
        [type]: (prev[type as keyof typeof prev] || 0) + 1
      }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/data-products/${commentId}/comments`] 
      });
    },
    onError: (error, { type }) => {
      // Revert the optimistic update
      setLocalReactions(prev => ({
        ...prev,
        [type]: (prev[type as keyof typeof prev] || 1) - 1
      }));

      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add reaction. Please try again.",
      });
    },
  });

  const handleReaction = (type: string) => {
    if (userReactions[type]) return;
    reactionMutation.mutate({ type });
    setUserReactions(prev => ({ ...prev, [type]: true }));
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
          className={`gap-1 ${userReactions.like ? 'text-primary hover:text-primary hover:bg-primary/10 dark:text-primary-foreground dark:hover:text-primary-foreground dark:hover:bg-primary/20' : ''}`}
          onClick={() => handleReaction('like')}
          disabled={userReactions.like}
        >
          <ThumbsUp className="h-4 w-4" />
          <span className="text-sm">{localReactions.like || 0}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className={`gap-1 ${userReactions.helpful ? 'text-primary hover:text-primary hover:bg-primary/10 dark:text-primary-foreground dark:hover:text-primary-foreground dark:hover:bg-primary/20' : ''}`}
          onClick={() => handleReaction('helpful')}
          disabled={userReactions.helpful}
        >
          <Award className="h-4 w-4" />
          <span className="text-sm">{localReactions.helpful || 0}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className={`gap-1 ${userReactions.insightful ? 'text-primary hover:text-primary hover:bg-primary/10 dark:text-primary-foreground dark:hover:text-primary-foreground dark:hover:bg-primary/20' : ''}`}
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
                  className="flex items-center gap-1 bg-primary/10 text-primary-foreground dark:bg-primary/20"
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