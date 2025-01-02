import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { 
  SendHorizontal, 
  MessageSquare, 
  ChevronDown, 
  ChevronUp, 
  BarChart2, 
  Loader2,
  SortAsc,
  Search,
  Filter
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CommentAnalytics from "./CommentAnalytics";
import CommentSummary from "./CommentSummary";
import EmojiPicker from "./EmojiPicker";

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

type SortOption = "newest" | "oldest" | "author";

export default function DataProductComments({ dataProductId }: DataProductCommentsProps) {
  const [newComment, setNewComment] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [textareaRef, setTextareaRef] = useState<HTMLTextAreaElement | null>(null);
  const [filterText, setFilterText] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery<Comment[]>({
    queryKey: [`/api/data-products/${dataProductId}/comments`],
  });

  // Filter and sort comments
  const filteredAndSortedComments = useMemo(() => {
    let filtered = comments;

    // Apply text filter
    if (filterText) {
      const searchLower = filterText.toLowerCase();
      filtered = filtered.filter(
        comment =>
          comment.content.toLowerCase().includes(searchLower) ||
          comment.authorName.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "author":
          return a.authorName.localeCompare(b.authorName);
        case "newest":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [comments, filterText, sortBy]);

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

  const handleEmojiSelect = (emoji: any) => {
    if (!textareaRef) return;

    const start = textareaRef.selectionStart;
    const end = textareaRef.selectionEnd;
    const text = newComment;
    const newText = text.substring(0, start) + emoji.native + text.substring(end);

    setNewComment(newText);

    setTimeout(() => {
      textareaRef.selectionStart = start + emoji.native.length;
      textareaRef.selectionEnd = start + emoji.native.length;
      textareaRef.focus();
    }, 0);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <h3 className="font-semibold">Comments</h3>
        </div>
        <div className="flex items-center gap-4">
          {comments.length > 0 && (
            <span className="text-sm text-muted-foreground">
              Total comments: {comments.length}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="flex items-center gap-2"
          >
            <BarChart2 className="h-4 w-4" />
            {showAnalytics ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {showAnalytics && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-4">
              <CommentAnalytics comments={comments} />
              <CommentSummary dataProductId={dataProductId} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
            disabled={addCommentMutation.isPending}
          />
          {validationErrors.authorName && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-red-500"
            >
              {validationErrors.authorName}
            </motion.p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="comment">Comment</Label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Textarea
                id="comment"
                ref={setTextareaRef}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className={`min-h-[80px] pr-10 ${validationErrors.content ? "border-red-500" : ""}`}
                required
                disabled={addCommentMutation.isPending}
              />
              <div className="absolute right-2 bottom-2">
                <EmojiPicker onEmojiSelect={handleEmojiSelect} />
              </div>
            </div>
            <Button
              type="submit"
              size="icon"
              disabled={addCommentMutation.isPending}
              className="relative"
            >
              {addCommentMutation.isPending ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Loader2 className="h-4 w-4 animate-spin" />
                </motion.div>
              ) : (
                <SendHorizontal className="h-4 w-4" />
              )}
            </Button>
          </div>
          {validationErrors.content && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-red-500"
            >
              {validationErrors.content}
            </motion.p>
          )}
        </div>
      </form>

      {/* Filter and Sort Controls */}
      <div className="flex items-center gap-4 py-2">
        <div className="flex-1 relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Search comments..."
            className="pl-8"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="author">By Author</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        {filteredAndSortedComments.map((comment) => (
          <motion.div
            key={comment.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
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
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-foreground"
              >
                {comment.content}
              </motion.p>
            </div>
          </motion.div>
        ))}

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center py-8 text-sm text-muted-foreground"
          >
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading comments...
          </motion.div>
        )}

        {!isLoading && filteredAndSortedComments.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-8 text-sm text-muted-foreground"
          >
            {filterText ? "No comments match your search." : "No comments yet. Be the first to comment!"}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}