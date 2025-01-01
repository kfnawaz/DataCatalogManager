import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

interface CommentSummaryProps {
  dataProductId: number;
}

interface SummaryResponse {
  summary: string;
  commentCount: number;
  lastUpdated: string;
}

export default function CommentSummary({ dataProductId }: CommentSummaryProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: summary, isLoading, refetch } = useQuery<SummaryResponse>({
    queryKey: [`/api/data-products/${dataProductId}/comments/summarize`],
    enabled: false,
  });

  const handleGenerateSummary = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">AI Summary</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerateSummary}
          disabled={isLoading || isRefreshing}
        >
          {(isLoading || isRefreshing) && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Generate Summary
        </Button>
      </CardHeader>
      <CardContent>
        {summary ? (
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
