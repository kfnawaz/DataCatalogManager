import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ApiUsageStats {
  summary: {
    total_requests: number;
    successful_requests: number;
    total_quota_used: number;
    unique_errors: number;
  };
  hourlyUsage: Array<{
    hour: string;
    requests: number;
    successful: number;
  }>;
}

export default function ApiUsageDashboard() {
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>('day');

  const { data: stats, isLoading, error } = useQuery<ApiUsageStats>({
    queryKey: ['/api/usage-stats', timeframe],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load API usage statistics</AlertDescription>
      </Alert>
    );
  }

  if (!stats) return null;

  const successRate = (stats.summary.successful_requests / stats.summary.total_requests * 100).toFixed(1);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.summary.total_requests}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Quota Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.summary.total_quota_used || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Unique Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.summary.unique_errors}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Usage Over Time</CardTitle>
            <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as typeof timeframe)}>
              <TabsList>
                <TabsTrigger value="day">24h</TabsTrigger>
                <TabsTrigger value="week">7d</TabsTrigger>
                <TabsTrigger value="month">30d</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.hourlyUsage}>
                <XAxis 
                  dataKey="hour"
                  tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                />
                <YAxis allowDecimals={false} />
                <Tooltip
                  labelFormatter={(value) => new Date(value).toLocaleString()}
                  formatter={(value: number) => [value, 'Requests']}
                />
                <Bar name="Total Requests" dataKey="requests" fill="hsl(var(--primary))" />
                <Bar name="Successful" dataKey="successful" fill="hsl(var(--primary))" opacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
