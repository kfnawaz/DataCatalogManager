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

  // Calculate health score (0-100)
  const healthScore = Math.min(100, Math.round(
    // Author diversity (0-25)
    (uniqueAuthors / Math.max(5, totalComments) * 25) +
    // Comment frequency (0-25)
    (Math.min(totalComments, 10) / 10 * 25) +
    // Average comment length (0-25)
    (Math.min(avgCommentLength, 200) / 200 * 25) +
    // Engagement consistency (0-25)
    (Object.values(commentsByAuthor).reduce((acc, count) => acc + Math.min(count, 5), 0) / 
    (Object.keys(commentsByAuthor).length * 5) * 25)
  ));

  // Get health status and color
  const getHealthStatus = (score: number) => {
    if (score >= 80) return { status: 'Excellent', color: 'text-green-500' };
    if (score >= 60) return { status: 'Good', color: 'text-blue-500' };
    if (score >= 40) return { status: 'Fair', color: 'text-yellow-500' };
    return { status: 'Needs Improvement', color: 'text-red-500' };
  };

  const healthStatus = getHealthStatus(healthScore);

  // Get top commenters
  const topCommenters = Object.entries(commentsByAuthor)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Calculate comment growth trends
  const sortedComments = [...comments].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  // Get weekly activity data
  const weeklyActivity = sortedComments.reduce((acc: Record<string, number>, comment) => {
    const week = format(new Date(comment.createdAt), 'MMM d');
    acc[week] = (acc[week] || 0) + 1;
    return acc;
  }, {});

  const activityData = Object.entries(weeklyActivity).map(([date, count]) => ({
    date,
    comments: count
  })).slice(-7);

  // Calculate growth rate
  const getGrowthRate = () => {
    if (comments.length < 2) return 0;
    const oldestDate = new Date(sortedComments[0].createdAt).getTime();
    const newestDate = new Date(sortedComments[sortedComments.length - 1].createdAt).getTime();
    const daysDiff = (newestDate - oldestDate) / (1000 * 60 * 60 * 24) || 1;
    return (comments.length / daysDiff).toFixed(1);
  };

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
        {/* Health Score */}
        <div className="mb-6 p-4 rounded-lg bg-background border">
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Comment Health Score</h4>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{healthScore}</span>
              <span className={`text-sm font-medium ${healthStatus.color}`}>
                {healthStatus.status}
              </span>
            </div>
            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full transition-all duration-500 ease-in-out"
                style={{ 
                  width: `${healthScore}%`,
                  backgroundColor: `hsl(var(--primary))`,
                  opacity: healthScore / 100
                }}
              />
            </div>
          </div>
        </div>

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
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Growth Rate</h4>
            <p className="text-2xl font-bold">{getGrowthRate()} /day</p>
          </div>
        </div>

        {/* Historical Trends */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Comment Activity Trends</h4>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData}>
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar 
                  dataKey="comments" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {topCommenters.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Top Commenters</h4>
            <div className="space-y-2">
              {topCommenters.map(([author, count], index) => (
                <div key={author} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${index === 0 ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                      {author}
                    </span>
                    {index === 0 && (
                      <span className="text-xs bg-primary/10 text-primary-foreground px-2 py-0.5 rounded-full border border-primary/20">
                        Top Contributor
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-medium">{count} comments</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}