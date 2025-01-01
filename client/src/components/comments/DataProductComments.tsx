import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { SendHorizontal, MessageSquare, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  authorName: string;
}

interface CommentResponse {
  comment: Comment;
  metrics: {
    totalComments: number;
    timestamp: string;
  };
}

interface DataProductCommentsProps {
  dataProductId: number;
}

interface ValidationErrors {
  content?: string;
  authorName?: string;
}

export default function DataProductComments({ dataProductId }: DataProductCommentsProps) {
  const [newComment, setNewComment] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery<Comment[]>({
    queryKey: [`/api/data-products/${dataProductId}/comments`],
  });

  const addCommentMutation = useMutation({
    mutationFn: async (data: { content: string; authorName: string }) => {
      const response = await fetch(`/api/data-products/${dataProductId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error === "Validation failed") {
          throw new Error(JSON.stringify(errorData.details));
        }
        throw new Error(errorData.details || "Failed to create comment");
      }

      return response.json() as Promise<CommentResponse>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/data-products/${dataProductId}/comments`] });
      setNewComment("");
      setAuthorName("");
      setValidationErrors({});
      toast({
        title: "Success",
        description: `Comment added successfully! Total comments: ${data.metrics.totalComments}`,
      });
    },
    onError: (error: Error) => {
      try {
        const parsedErrors = JSON.parse(error.message);
        setValidationErrors(parsedErrors);
      } catch {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message,
        });
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});
    if (newComment.trim() && authorName.trim()) {
      addCommentMutation.mutate({ content: newComment, authorName });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <h3 className="font-semibold">Comments</h3>
        </div>
        {comments.length > 0 && (
          <span className="text-sm text-muted-foreground">
            Total comments: {comments.length}
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="author">Your Name</Label>
          <Input
            id="author"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Enter your name"
            required
            className={validationErrors.authorName ? "border-red-500" : ""}
          />
          {validationErrors.authorName && (
            <p className="text-sm text-red-500">{validationErrors.authorName}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="comment">Comment</Label>
          <div className="flex gap-2">
            <Textarea
              id="comment"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className={`min-h-[80px] ${validationErrors.content ? "border-red-500" : ""}`}
              required
            />
            <Button 
              type="submit" 
              size="icon"
              disabled={addCommentMutation.isPending}
            >
              <SendHorizontal className="h-4 w-4" />
            </Button>
          </div>
          {validationErrors.content && (
            <p className="text-sm text-red-500">{validationErrors.content}</p>
          )}
        </div>
      </form>

      <AnimatePresence mode="popLayout">
        {comments.map((comment) => (
          <motion.div
            key={comment.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex gap-4 py-4 border-b last:border-0"
          >
            <Avatar>
              <AvatarFallback>
                {comment.authorName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{comment.authorName}</span>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(comment.createdAt), "PPp")}
                </span>
              </div>
              <p className="text-sm text-foreground">{comment.content}</p>
            </div>
          </motion.div>
        ))}

        {isLoading && (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            Loading comments...
          </div>
        )}

        {!isLoading && comments.length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No comments yet. Be the first to comment!
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}