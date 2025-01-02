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
  reactions = { like: 0, helpful: 0, insightful: 0 }, 
  badges = [] 
}: CommentReactionsProps) {
  const [userReactions, setUserReactions] = useState<Record<string, boolean>>({});
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
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/data-products/${commentId}/comments`] 
      });
    },
    onError: () => {
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
          className={`gap-1 ${userReactions.like ? 'text-primary' : ''}`}
          onClick={() => handleReaction('like')}
          disabled={userReactions.like}
        >
          <ThumbsUp className="h-4 w-4" />
          <span className="text-sm">{reactions?.like || 0}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className={`gap-1 ${userReactions.helpful ? 'text-primary' : ''}`}
          onClick={() => handleReaction('helpful')}
          disabled={userReactions.helpful}
        >
          <Award className="h-4 w-4" />
          <span className="text-sm">{reactions?.helpful || 0}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className={`gap-1 ${userReactions.insightful ? 'text-primary' : ''}`}
          onClick={() => handleReaction('insightful')}
          disabled={userReactions.insightful}
        >
          <Brain className="h-4 w-4" />
          <span className="text-sm">{reactions?.insightful || 0}</span>
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
                  className="flex items-center gap-1"
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