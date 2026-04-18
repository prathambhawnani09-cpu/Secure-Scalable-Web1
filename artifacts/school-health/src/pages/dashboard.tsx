import { useState } from "react";
import { format } from "date-fns";
import { 
  useGetDashboardSummary, 
  useGetSymptomTrends, 
  useGetClassroomHeatmap, 
  useGetRecentActivity 
} from "@workspace/api-client-react";
import { 
  Activity, 
  AlertTriangle, 
  Stethoscope, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";

export default function DashboardPage() {
  const [days] = useState(7);
  
  const { data: summary, isLoading: isLoadingSummary, isError: isErrorSummary } = useGetDashboardSummary();
  const { data: trends, isLoading: isLoadingTrends } = useGetSymptomTrends({ days });
  const { data: heatmap, isLoading: isLoadingHeatmap } = useGetClassroomHeatmap({ days });
  const { data: activity, isLoading: isLoadingActivity } = useGetRecentActivity({ limit: 5 });

  if (isErrorSummary) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Failed to load dashboard data. Please try again later.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const renderTrendIcon = (trend: string) => {
    if (trend === "up") return <TrendingUp className="h-4 w-4 text-destructive" />;
    if (trend === "down") return <TrendingDown className="h-4 w-4 text-success" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  // Transform trends data for Recharts
  const chartData: any[] = [];
  if (trends?.series && trends.series.length > 0) {
    // Assuming all series have same dates
    trends.series[0].data.forEach((d, i) => {
      const dataPoint: any = { date: format(new Date(d.date), "MMM dd") };
      trends.series.forEach(s => {
        dataPoint[s.symptom] = s.data[i].count;
      });
      chartData.push(dataPoint);
    });
  }

  const colors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground">Real-time health intelligence for your school.</p>
      </div>

      {/* Top Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visits Today</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? <Skeleton className="h-8 w-16" /> : (
              <>
                <div className="text-2xl font-bold">{summary?.todayVisits || 0}</div>
                <div className="flex items-center text-sm mt-1">
                  {summary && renderTrendIcon(summary.visitTrend)}
                  <span className="text-muted-foreground ml-2">vs yesterday</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? <Skeleton className="h-8 w-16" /> : (
              <>
                <div className="text-2xl font-bold">{summary?.activeAlerts || 0}</div>
                <div className="flex items-center text-sm mt-1">
                  {summary && renderTrendIcon(summary.alertTrend)}
                  <span className="text-muted-foreground ml-2">vs last week</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Severity</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? <Skeleton className="h-8 w-16" /> : (
              <>
                <div className="text-2xl font-bold">{summary?.highSeverityAlerts || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Require immediate attention</p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students Monitored</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? <Skeleton className="h-8 w-16" /> : (
              <>
                <div className="text-2xl font-bold">{summary?.studentsMonitored || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Active risk profiles</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        {/* Symptom Trends Chart */}
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Symptom Trends</CardTitle>
            <CardDescription>7-day rolling average of reported symptoms</CardDescription>
          </CardHeader>
          <CardContent className="pl-0">
            {isLoadingTrends ? (
              <div className="h-[300px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : chartData.length > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                    {trends?.series.map((s, i) => (
                      <Line 
                        key={s.symptom} 
                        type="monotone" 
                        dataKey={s.symptom} 
                        stroke={colors[i % colors.length]} 
                        strokeWidth={2}
                        dot={{ r: 4, strokeWidth: 2 }}
                        activeDot={{ r: 6 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No trend data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest events across the campus</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingActivity ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex items-start gap-4">
                    <Skeleton className="h-2 w-2 mt-2 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {activity?.activities.map((item) => (
                  <div key={item.id} className="flex items-start gap-4">
                    <div className={`mt-1.5 h-2 w-2 rounded-full ${
                      item.type === 'alert' && item.severity === 'high' ? 'bg-destructive' :
                      item.type === 'alert' && item.severity === 'medium' ? 'bg-warning' :
                      item.type === 'resolved' ? 'bg-success' : 'bg-primary'
                    }`} />
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(item.timestamp), "h:mm a")}</p>
                    </div>
                  </div>
                ))}
                {(!activity?.activities || activity.activities.length === 0) && (
                  <div className="text-center text-muted-foreground py-8">
                    No recent activity
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Classroom Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle>Classroom Heatmap</CardTitle>
          <CardDescription>Visit concentration by classroom over the last {days} days</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingHeatmap ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {heatmap?.classrooms.map((room) => (
                <div 
                  key={room.classroom} 
                  className={`p-4 rounded-lg border ${
                    room.riskLevel === 'high' ? 'bg-destructive/10 border-destructive/20 text-destructive' :
                    room.riskLevel === 'medium' ? 'bg-warning/10 border-warning/20 text-warning-foreground' :
                    'bg-card border-border'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold">{room.classroom}</span>
                    <Badge variant={room.riskLevel === 'high' ? 'destructive' : room.riskLevel === 'medium' ? 'outline' : 'secondary'} className={room.riskLevel === 'medium' ? 'bg-warning text-warning-foreground border-transparent' : ''}>
                      {room.riskLevel}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold mb-1">{room.visitCount}</div>
                  <div className="text-xs opacity-80 truncate">Top: {room.topSymptom || 'None'}</div>
                </div>
              ))}
              {(!heatmap?.classrooms || heatmap.classrooms.length === 0) && (
                <div className="col-span-full text-center text-muted-foreground py-8">
                  No classroom data available
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
