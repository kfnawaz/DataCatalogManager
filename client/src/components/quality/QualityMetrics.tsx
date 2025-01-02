import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface MetricHistory {
  timestamp: string;
  value: number;
  metadata: Record<string, any>;
}

interface MetricData {
  current: {
    completeness: number;
    accuracy: number;
    timeliness: number;
    customMetrics?: Record<string, number>;
  };
  history: MetricHistory[];
}

interface QualityMetricsProps {
  dataProductId: number | null;
}

export default function QualityMetrics({ dataProductId }: QualityMetricsProps) {
  const { data: metrics, isLoading, error } = useQuery<MetricData>({
    queryKey: [`/api/quality-metrics/${dataProductId}`],
    enabled: dataProductId !== null,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (!dataProductId) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Data Product Selected</AlertTitle>
        <AlertDescription>
          Select a data product to view its quality metrics
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px]" />
          ))}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load quality metrics. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (!metrics) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Data Available</AlertTitle>
        <AlertDescription>
          No quality metrics found for this data product
        </AlertDescription>
      </Alert>
    );
  }

  const formattedData = metrics.history?.map((item) => ({
    ...item,
    timestamp: format(new Date(item.timestamp), "MMM d, yyyy HH:mm"),
  })) || [];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="Completeness"
            value={metrics.current?.completeness ?? 0}
            description="Percentage of non-null values"
            trend={calculateTrend(formattedData, 'completeness')}
          />
          <MetricCard
            title="Accuracy"
            value={metrics.current?.accuracy ?? 0}
            description="Percentage of accurate data points"
            trend={calculateTrend(formattedData, 'accuracy')}
          />
          <MetricCard
            title="Timeliness"
            value={metrics.current?.timeliness ?? 0}
            description="Data freshness score"
            trend={calculateTrend(formattedData, 'timeliness')}
          />
        </div>

        {metrics.current?.customMetrics && Object.keys(metrics.current.customMetrics).length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(metrics.current.customMetrics).map(([key, value]) => (
              <MetricCard
                key={key}
                title={formatMetricName(key)}
                value={value}
                description="Custom metric value"
                trend={calculateTrend(formattedData, key)}
              />
            ))}
          </div>
        )}

        {formattedData.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Historical Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formattedData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                      labelStyle={{
                        color: "hsl(var(--foreground))",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="completeness"
                      name="Completeness"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="accuracy"
                      name="Accuracy"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      strokeOpacity={0.7}
                      dot={false}
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="timeliness"
                      name="Timeliness"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      strokeOpacity={0.4}
                      dot={false}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Historical Data</AlertTitle>
            <AlertDescription>
              No historical data available for this data product
            </AlertDescription>
          </Alert>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

interface MetricCardProps {
  title: string;
  value: number;
  description: string;
  trend?: number;
}

function MetricCard({ title, value, description, trend }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30
      }}
    >
      <Card>
        <CardContent className="pt-6">
          <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
          <div className="mt-2 flex items-baseline gap-2">
            <div className="text-3xl font-semibold">{value}%</div>
            {trend !== undefined && (
              <div className={`text-sm ${trend > 0 ? 'text-green-500' : trend < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} {Math.abs(trend)}%
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function calculateTrend(data: any[], metric: string): number | undefined {
  if (data.length < 2) return undefined;

  const current = data[data.length - 1][metric];
  const previous = data[data.length - 2][metric];

  if (typeof current !== 'number' || typeof previous !== 'number') return undefined;

  return Number(((current - previous) / previous * 100).toFixed(1));
}

function formatMetricName(key: string): string {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}