import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

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
  // Calculate analytics
  const totalComments = comments.length;
  const uniqueAuthors = new Set(comments.map(c => c.authorName)).size;
  const avgCommentLength = comments.reduce((acc, c) => acc + c.content.length, 0) / totalComments || 0;

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comment Analytics</CardTitle>
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

        <div className="h-[200px] mt-4">
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
