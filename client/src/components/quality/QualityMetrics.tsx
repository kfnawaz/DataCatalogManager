import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { format, subDays } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MetricHistory {
  timestamp: string;
  completeness: number | null;
  accuracy: number | null;
  timeliness: number | null;
  metadata?: Record<string, any>;
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

type ChartType = 'line' | 'bar';
type TimeRange = '7d' | '30d' | '90d' | 'all';

// Helper function to get trend icon
function getTrendIcon(trend: number) {
  if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
  if (trend < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

// Helper function to calculate trend
function calculateTrend(data: MetricHistory[], metric: keyof Pick<MetricHistory, 'completeness' | 'accuracy' | 'timeliness'>): number | undefined {
  if (data.length < 2) return undefined;

  const validPoints = data.filter(point => point[metric] !== null);
  if (validPoints.length < 2) return undefined;

  const current = validPoints[validPoints.length - 1][metric];
  const previous = validPoints[validPoints.length - 2][metric];

  if (current === null || previous === null) return undefined;

  return Number(((current - previous) / previous * 100).toFixed(1));
}

export default function QualityMetrics({ dataProductId }: QualityMetricsProps) {
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);
  const [chartType, setChartType] = useState<ChartType>('line');
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  const { data: metrics, isLoading, error } = useQuery<MetricData>({
    queryKey: [`/api/quality-metrics/${dataProductId}`, timeRange],
    enabled: dataProductId !== null,
    refetchInterval: 30000,
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
    console.error("Quality metrics error:", error);
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

  if (!metrics || !metrics.history) {
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

  // Filter data based on selected time range
  const filterDataByTimeRange = (data: MetricHistory[]) => {
    if (timeRange === 'all') return data;

    const ranges = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
    };

    const cutoffDate = subDays(new Date(), ranges[timeRange]);
    return data.filter(item => new Date(item.timestamp) >= cutoffDate);
  };

  const formattedData = filterDataByTimeRange(metrics.history.map(item => ({
    ...item,
    timestamp: format(new Date(item.timestamp), "MMM d, yyyy HH:mm"),
  })));

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
        <div className="flex justify-end gap-4 mb-6">
          <Select value={chartType} onValueChange={(value) => setChartType(value as ChartType)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Chart Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="line">Line Chart</SelectItem>
              <SelectItem value="bar">Bar Chart</SelectItem>
            </SelectContent>
          </Select>

          <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>

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
                    trend={calculateTrend(metrics.history, metric)}
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
                title={key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}
                value={value}
                description="Custom metric value"
                health={getHealthStatus(value)}
                healthColor={getHealthColor(value)}
              />
            ))}
          </div>
        )}

        {formattedData.length > 0 ? (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Historical Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'line' ? (
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
                      <Legend wrapperStyle={{ paddingTop: "2rem" }} />
                      <Line
                        type="monotone"
                        dataKey="completeness"
                        name="Completeness"
                        stroke="hsl(var(--chart-1))"
                        strokeWidth={2}
                        connectNulls={true}
                        dot={{ fill: "hsl(var(--chart-1))", r: 4 }}
                        activeDot={{ r: 8 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="accuracy"
                        name="Accuracy"
                        stroke="hsl(var(--chart-2))"
                        strokeWidth={2}
                        connectNulls={true}
                        dot={{ fill: "hsl(var(--chart-2))", r: 4 }}
                        activeDot={{ r: 8 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="timeliness"
                        name="Timeliness"
                        stroke="hsl(var(--chart-3))"
                        strokeWidth={2}
                        connectNulls={true}
                        dot={{ fill: "hsl(var(--chart-3))", r: 4 }}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  ) : (
                    <BarChart
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
                      <Legend wrapperStyle={{ paddingTop: "2rem" }} />
                      <Bar
                        dataKey="completeness"
                        name="Completeness"
                        fill="hsl(var(--chart-1))"
                      />
                      <Bar
                        dataKey="accuracy"
                        name="Accuracy"
                        fill="hsl(var(--chart-2))"
                      />
                      <Bar
                        dataKey="timeliness"
                        name="Timeliness"
                        fill="hsl(var(--chart-3))"
                      />
                    </BarChart>
                  )}
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
              <div className="text-3xl font-semibold">{Math.round(value)}%</div>
              {trend !== undefined && (
                <div className="flex items-center gap-1">
                  {getTrendIcon(trend)}
                  <span className="text-sm">
                    {Math.abs(trend)}%
                  </span>
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

function formatMetricName(key: string): string {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}