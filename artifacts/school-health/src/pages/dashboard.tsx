import { useState } from "react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { 
  useGetDashboardSummary, 
  useGetSymptomTrends, 
  useGetClassroomHeatmap, 
  useGetRecentActivity 
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { 
  Activity, 
  AlertTriangle, 
  Stethoscope, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Loader2,
  AlertCircle,
  Flame,
  ThermometerSun
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";

function OutbreakRiskCell({ room }: { room: { classroom: string; visitCount: number; riskLevel: string; topSymptom: string | null } }) {
  const maxVisits = 12;
  const pct = Math.min(100, Math.round((room.visitCount / maxVisits) * 100));

  const gradient =
    room.riskLevel === "high"
      ? "from-red-500 to-orange-500"
      : room.riskLevel === "medium"
      ? "from-orange-400 to-yellow-400"
      : "from-emerald-400 to-teal-400";

  const textColor =
    room.riskLevel === "high"
      ? "text-red-700"
      : room.riskLevel === "medium"
      ? "text-orange-700"
      : "text-emerald-700";

  const bgColor =
    room.riskLevel === "high"
      ? "bg-red-50 border-red-200"
      : room.riskLevel === "medium"
      ? "bg-orange-50 border-orange-200"
      : "bg-emerald-50 border-emerald-200";

  const badge =
    room.riskLevel === "high"
      ? "bg-red-500 text-white"
      : room.riskLevel === "medium"
      ? "bg-orange-400 text-white"
      : "bg-emerald-500 text-white";

  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-2 ${bgColor} transition-transform hover:scale-105`}>
      <div className="flex items-center justify-between">
        <span className="font-bold text-lg tracking-wide">{room.classroom}</span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge}`}>
          {room.riskLevel.toUpperCase()}
        </span>
      </div>
      <div className={`text-3xl font-extrabold ${textColor}`}>{pct}%</div>
      <div className="text-xs text-muted-foreground font-medium">Outbreak risk</div>
      <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
        <div
          className={`h-2 rounded-full bg-gradient-to-r ${gradient}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-xs mt-1">
        <span className="text-muted-foreground">{room.visitCount} visit{room.visitCount !== 1 ? "s" : ""}</span>
        <span className="text-muted-foreground truncate max-w-[80px]">
          {room.topSymptom ? `↑ ${room.topSymptom}` : "No data"}
        </span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [days] = useState(7);
  const { token } = useAuth();
  
  const { data: summary, isLoading: isLoadingSummary, isError: isErrorSummary } = useGetDashboardSummary();
  const { data: trends, isLoading: isLoadingTrends } = useGetSymptomTrends({ days });
  const { data: heatmap, isLoading: isLoadingHeatmap } = useGetClassroomHeatmap({ days });
  const { data: activity, isLoading: isLoadingActivity } = useGetRecentActivity({ limit: 5 });

  const { data: dailyVisits, isLoading: isLoadingDailyVisits } = useQuery({
    queryKey: ["daily-visits", 14],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/daily-visits?days=14", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return res.json() as Promise<{ days: number; data: { date: string; visits: number }[] }>;
    },
  });

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
    if (trend === "up") return <TrendingUp className="h-4 w-4 text-red-400" />;
    if (trend === "down") return <TrendingDown className="h-4 w-4 text-emerald-400" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const chartData: any[] = [];
  if (trends?.series && trends.series.length > 0) {
    trends.series[0].data.forEach((d, i) => {
      const dataPoint: any = { date: format(new Date(d.date), "MMM dd") };
      trends.series.forEach(s => {
        dataPoint[s.symptom] = s.data[i].count;
      });
      chartData.push(dataPoint);
    });
  }

  const colors = ["#6366f1", "#f43f5e", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6"];

  const sortedRooms = [...(heatmap?.classrooms ?? [])].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return (order[a.riskLevel as keyof typeof order] ?? 3) - (order[b.riskLevel as keyof typeof order] ?? 3);
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground">Real-time health intelligence for your school.</p>
      </div>

      {/* Colorful Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-5 text-white shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium opacity-90">Visits Today</span>
            <div className="bg-white/20 rounded-lg p-1.5">
              <Stethoscope className="h-4 w-4" />
            </div>
          </div>
          {isLoadingSummary ? <Skeleton className="h-9 w-16 bg-white/30" /> : (
            <>
              <div className="text-4xl font-extrabold">{summary?.todayVisits ?? 0}</div>
              <div className="flex items-center text-xs mt-2 opacity-80 gap-1">
                {summary && renderTrendIcon(summary.visitTrend)}
                vs yesterday
              </div>
            </>
          )}
        </div>

        <div className="rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 p-5 text-white shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium opacity-90">Active Alerts</span>
            <div className="bg-white/20 rounded-lg p-1.5">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          {isLoadingSummary ? <Skeleton className="h-9 w-16 bg-white/30" /> : (
            <>
              <div className="text-4xl font-extrabold">{summary?.activeAlerts ?? 0}</div>
              <div className="flex items-center text-xs mt-2 opacity-80 gap-1">
                {summary && renderTrendIcon(summary.alertTrend)}
                vs last week
              </div>
            </>
          )}
        </div>

        <div className="rounded-xl bg-gradient-to-br from-red-500 to-rose-600 p-5 text-white shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium opacity-90">High Severity</span>
            <div className="bg-white/20 rounded-lg p-1.5">
              <Flame className="h-4 w-4" />
            </div>
          </div>
          {isLoadingSummary ? <Skeleton className="h-9 w-16 bg-white/30" /> : (
            <>
              <div className="text-4xl font-extrabold">{summary?.highSeverityAlerts ?? 0}</div>
              <div className="text-xs mt-2 opacity-80">Require immediate action</div>
            </>
          )}
        </div>

        <div className="rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 p-5 text-white shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium opacity-90">Students Monitored</span>
            <div className="bg-white/20 rounded-lg p-1.5">
              <Users className="h-4 w-4" />
            </div>
          </div>
          {isLoadingSummary ? <Skeleton className="h-9 w-16 bg-white/30" /> : (
            <>
              <div className="text-4xl font-extrabold">{summary?.studentsMonitored ?? 0}</div>
              <div className="text-xs mt-2 opacity-80">Active risk profiles</div>
            </>
          )}
        </div>
      </div>

      {/* Classroom Outbreak Risk Heatmap */}
      <Card className="border-2">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-xl">
            <ThermometerSun className="h-5 w-5 text-orange-500" />
            Classroom Outbreak Risk Heatmap
          </CardTitle>
          <CardDescription>
            Ranked by outbreak probability — last {days} days. Red = highest risk of spreading.
          </CardDescription>
          <div className="flex items-center gap-3 pt-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="w-3 h-3 rounded-full bg-emerald-500" /> Low risk
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="w-3 h-3 rounded-full bg-orange-400" /> Medium risk
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="w-3 h-3 rounded-full bg-red-500" /> High risk
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingHeatmap ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-xl" />
              ))}
            </div>
          ) : sortedRooms.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">No classroom data available</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {sortedRooms.map((room) => (
                <OutbreakRiskCell key={room.classroom} room={room} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daily Visits Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            Daily Patient Visits
          </CardTitle>
          <CardDescription>Number of patients seen each day over the last 14 days</CardDescription>
        </CardHeader>
        <CardContent className="pl-0">
          {isLoadingDailyVisits ? (
            <div className="h-[220px] flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={(dailyVisits?.data ?? []).map(d => ({
                    date: format(new Date(d.date + "T00:00:00"), "MMM dd"),
                    Patients: d.visits,
                  }))}
                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: "hsl(var(--popover))", borderColor: "hsl(var(--border))", borderRadius: "8px" }}
                    itemStyle={{ color: "hsl(var(--foreground))" }}
                    cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                  />
                  <Bar dataKey="Patients" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-7">
        {/* Symptom Trends */}
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
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
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
              <div className="space-y-5">
                {activity?.activities.map((item) => (
                  <div key={item.id} className="flex items-start gap-3">
                    <div className={`mt-1.5 h-2.5 w-2.5 rounded-full flex-shrink-0 ${
                      item.type === 'alert' && item.severity === 'high' ? 'bg-red-500' :
                      item.type === 'alert' && item.severity === 'medium' ? 'bg-orange-400' :
                      item.type === 'resolved' ? 'bg-emerald-500' : 'bg-indigo-400'
                    }`} />
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium leading-none">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(item.timestamp), "h:mm a")}</p>
                    </div>
                  </div>
                ))}
                {(!activity?.activities || activity.activities.length === 0) && (
                  <div className="text-center text-muted-foreground py-8">No recent activity</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
