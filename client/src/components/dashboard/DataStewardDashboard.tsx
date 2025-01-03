import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Award, Target, TrendingUp, Users, ChevronUp, ChevronDown } from "lucide-react";

interface StewardshipMetrics {
  totalComments: number;
  helpfulComments: number;
  qualityImprovements: number;
  dataProductsManaged: number;
  reputationScore: number;
  level: number;
  badges: Array<{
    type: string;
    name: string;
    description: string;
    earnedAt: string;
  }>;
  recentActivities: Array<{
    type: string;
    description: string;
    timestamp: string;
    impact: number;
  }>;
  qualityTrend: Array<{
    date: string;
    score: number;
  }>;
}

function getStatusBadge(value: number, type: string) {
  let status = '';
  let variant: 'default' | 'secondary' = 'default';

  if (type === 'quality') {
    if (value >= 90) status = 'Excellent';
    else if (value >= 70) status = 'Good';
    else if (value >= 50) status = 'Fair';
    else status = 'Needs Improvement';
  } else if (type === 'engagement') {
    if (value >= 80) status = 'High';
    else if (value >= 50) status = 'Moderate';
    else status = 'Low';
  }

  if (status === 'Excellent' || status === 'High') variant = 'default';
  else variant = 'secondary';

  return <Badge variant={variant} className="mt-2">{status}</Badge>;
}

export default function DataStewardDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  const { data: metrics, isLoading } = useQuery<StewardshipMetrics>({
    queryKey: ["/api/stewardship/metrics"],
  });

  if (isLoading || !metrics) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 w-1/2 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-1/3 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const levelProgress = (metrics.reputationScore % 100);

  // Calculate trends (for demonstration, you would typically get this from the API)
  const qualityTrend = {
    value: ((metrics.qualityImprovements / Math.max(1, metrics.dataProductsManaged)) * 100),
    change: 14.5,
    isPositive: true
  };

  const engagementTrend = {
    value: ((metrics.helpfulComments / Math.max(1, metrics.totalComments)) * 100),
    change: 8.3,
    isPositive: true
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards with Enhanced Descriptions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Award className="h-4 w-4" />
              Quality Impact Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold">{qualityTrend.value.toFixed(1)}%</div>
              <div className={`flex items-center text-sm ${qualityTrend.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {qualityTrend.isPositive ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                {qualityTrend.change}%
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Measures the percentage of successful quality improvements across managed data products.
              Higher values indicate more effective data stewardship.
            </p>
            {getStatusBadge(qualityTrend.value, 'quality')}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <TrendingUp className="h-4 w-4" />
              Engagement Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold">{engagementTrend.value.toFixed(1)}%</div>
              <div className={`flex items-center text-sm ${engagementTrend.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {engagementTrend.isPositive ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                {engagementTrend.change}%
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Reflects community engagement through helpful comments and reactions.
              Higher scores indicate more valuable contributions.
            </p>
            {getStatusBadge(engagementTrend.value, 'engagement')}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Target className="h-4 w-4" />
              Stewardship Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">Level {metrics.level}</div>
            <Progress value={levelProgress} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">
              Your data stewardship expertise level.
              Progress through levels by improving data quality and engagement.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {levelProgress}% progress to next level
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4" />
              Active Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.dataProductsManaged}</div>
            <p className="text-sm text-muted-foreground mt-2">
              Number of data products under your stewardship.
              More products increase your potential impact scope.
            </p>
            {getStatusBadge(
              (metrics.dataProductsManaged >= 5 ? 100 : (metrics.dataProductsManaged / 5) * 100),
              'engagement'
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Content */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
              <TabsTrigger value="activity">Recent Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics.qualityTrend}>
                    <XAxis 
                      dataKey="date"
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      formatter={(value: number) => [`${value}%`, 'Quality Score']}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="achievements" className="mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                {metrics.badges.map((badge, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Award className="h-4 w-4 text-primary" />
                        {badge.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-2">
                        {badge.description}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        Earned on {new Date(badge.earnedAt).toLocaleDateString()}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="activity" className="mt-4">
              <div className="space-y-4">
                {metrics.recentActivities.map((activity, index) => (
                  <Card key={index}>
                    <CardContent className="flex items-center justify-between py-4">
                      <div>
                        <p className="text-sm font-medium">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <Badge 
                        variant={activity.impact > 50 ? "default" : "secondary"}
                        className="ml-2"
                      >
                        +{activity.impact} points
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}