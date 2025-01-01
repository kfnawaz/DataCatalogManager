import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { Download, BarChart2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  authorName: string;
}

interface CommentAnalyticsProps {
  comments: Comment[];
}

export default function CommentAnalytics({ comments }: CommentAnalyticsProps) {
  const { toast } = useToast();

  // Calculate analytics
  const totalComments = comments.length;
  const uniqueAuthors = new Set(comments.map(c => c.authorName)).size;
  const avgCommentLength = comments.reduce((acc, c) => acc + c.content.length, 0) / totalComments || 0;
  const commentsByAuthor = comments.reduce((acc: Record<string, number>, comment) => {
    acc[comment.authorName] = (acc[comment.authorName] || 0) + 1;
    return acc;
  }, {});

  // Get top commenters
  const topCommenters = Object.entries(commentsByAuthor)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Prepare data for the activity chart
  const activityData = comments.reduce((acc: Record<string, number>, comment) => {
    const date = format(new Date(comment.createdAt), 'MMM d');
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(activityData).map(([date, count]) => ({
    date,
    comments: count
  })).slice(-7); // Show last 7 days

  // Export comments to CSV
  const exportComments = () => {
    try {
      // Prepare CSV content
      const headers = ['ID', 'Author', 'Content', 'Created At'];
      const csvContent = [
        headers.join(','),
        ...comments.map(comment => [
          comment.id,
          `"${comment.authorName.replace(/"/g, '""')}"`,
          `"${comment.content.replace(/"/g, '""')}"`,
          format(new Date(comment.createdAt), 'yyyy-MM-dd HH:mm:ss')
        ].join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `comments_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Successful",
        description: `${comments.length} comments exported to CSV`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Failed to export comments. Please try again.",
      });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <BarChart2 className="h-5 w-5" />
          Comment Analytics
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={exportComments}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-background border">
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Total Comments</h4>
            <p className="text-2xl font-bold">{totalComments}</p>
          </div>
          <div className="p-4 rounded-lg bg-background border">
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Unique Authors</h4>
            <p className="text-2xl font-bold">{uniqueAuthors}</p>
          </div>
          <div className="p-4 rounded-lg bg-background border">
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Avg. Length</h4>
            <p className="text-2xl font-bold">{Math.round(avgCommentLength)}</p>
          </div>
        </div>

        {topCommenters.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Top Commenters</h4>
            <div className="space-y-2">
              {topCommenters.map(([author, count]) => (
                <div key={author} className="flex items-center justify-between">
                  <span className="text-sm">{author}</span>
                  <span className="text-sm font-medium">{count} comments</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="h-[200px] mt-4">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Comment Activity</h4>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="comments" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}