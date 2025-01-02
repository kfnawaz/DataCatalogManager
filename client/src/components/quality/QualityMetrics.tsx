import { useState } from "react";
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
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);

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

  const getMetricDescription = (metric: string) => {
    switch (metric) {
      case 'completeness':
        return "Measures the percentage of non-null values across all fields. Higher values indicate more complete data.";
      case 'accuracy':
        return "Indicates the percentage of data points that meet predefined accuracy criteria. Higher values suggest more reliable data.";
      case 'timeliness':
        return "Reflects how up-to-date the data is based on expected update frequencies. Higher scores mean fresher data.";
      default:
        return "Custom metric measuring specific data quality aspects defined for this product.";
    }
  };

  const getHealthStatus = (value: number) => {
    if (value >= 90) return "Excellent";
    if (value >= 75) return "Good";
    if (value >= 60) return "Fair";
    return "Needs Attention";
  };

  const getHealthColor = (value: number) => {
    if (value >= 90) return "text-green-500 dark:text-green-400";
    if (value >= 75) return "text-blue-500 dark:text-blue-400";
    if (value >= 60) return "text-yellow-500 dark:text-yellow-400";
    return "text-red-500 dark:text-red-400";
  };

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
          {(['completeness', 'accuracy', 'timeliness'] as const).map((metric) => (
            <UITooltip key={metric}>
              <TooltipTrigger asChild>
                <div 
                  onMouseEnter={() => setHoveredMetric(metric)}
                  onMouseLeave={() => setHoveredMetric(null)}
                >
                  <MetricCard
                    title={metric.charAt(0).toUpperCase() + metric.slice(1)}
                    value={metrics.current[metric]}
                    description={getMetricDescription(metric)}
                    trend={calculateTrend(formattedData, metric)}
                    health={getHealthStatus(metrics.current[metric])}
                    healthColor={getHealthColor(metrics.current[metric])}
                    isHovered={hoveredMetric === metric}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p className="text-sm">{getMetricDescription(metric)}</p>
              </TooltipContent>
            </UITooltip>
          ))}
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
                health={getHealthStatus(value)}
                healthColor={getHealthColor(value)}
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
                  <LineChart 
                    data={formattedData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 80 }}
                  >
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke="hsl(var(--muted-foreground) / 0.2)"
                    />
                    <XAxis 
                      dataKey="timestamp"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ 
                        fill: "hsl(var(--muted-foreground))",
                        fontSize: 12 
                      }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis 
                      domain={[0, 100]}
                      tick={{ 
                        fill: "hsl(var(--muted-foreground))",
                        fontSize: 12 
                      }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                      labelStyle={{
                        color: "hsl(var(--foreground))",
                      }}
                      itemStyle={{
                        color: "hsl(var(--foreground))",
                      }}
                    />
                    <Legend 
                      wrapperStyle={{
                        paddingTop: "2rem"
                      }}
                    />
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
  health?: string;
  healthColor?: string;
  isHovered?: boolean;
}

function MetricCard({ 
  title, 
  value, 
  description, 
  trend,
  health,
  healthColor,
  isHovered
}: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ 
        opacity: 1, 
        scale: isHovered ? 1.02 : 1,
        y: isHovered ? -4 : 0
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30
      }}
      className="cursor-pointer"
    >
      <Card className="overflow-hidden">
        <CardContent className="pt-6">
          <motion.div
            initial={false}
            animate={{ height: isHovered ? 'auto' : 'auto' }}
          >
            <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
            <div className="mt-2 flex items-baseline gap-2">
              <div className="text-3xl font-semibold">{value}%</div>
              {trend !== undefined && (
                <div className={`text-sm ${trend > 0 ? 'text-green-500' : trend < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                  {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} {Math.abs(trend)}%
                </div>
              )}
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">{description}</p>
              {health && (
                <span className={`text-xs font-medium ${healthColor}`}>
                  {health}
                </span>
              )}
            </div>
          </motion.div>
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