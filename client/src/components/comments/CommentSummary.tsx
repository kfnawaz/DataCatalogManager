import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CommentSummaryProps {
  dataProductId: number;
}

interface SummaryResponse {
  summary: string;
  commentCount: number;
  lastUpdated: string;
}

interface ErrorResponse {
  error: string;
  details: string;
}

export default function CommentSummary({ dataProductId }: CommentSummaryProps) {
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const summarizeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/data-products/${dataProductId}/comments/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json() as ErrorResponse;
        throw new Error(errorData.details || "Failed to generate summary");
      }

      return response.json() as Promise<SummaryResponse>;
    },
    onSuccess: (data) => {
      setSummary(data);
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">AI Summary</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => summarizeMutation.mutate()}
          disabled={summarizeMutation.isPending}
        >
          {summarizeMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Generate Summary
        </Button>
      </CardHeader>
      <CardContent>
        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : summary ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{summary.summary}</p>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Based on {summary.commentCount} comments</span>
              <span>
                Last updated: {format(new Date(summary.lastUpdated), "PP p")}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Click the button above to generate an AI-powered summary of the comments.
          </p>
        )}
      </CardContent>
    </Card>
  );
}