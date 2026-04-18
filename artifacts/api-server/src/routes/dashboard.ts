import { Router } from "express";
import { db } from "@workspace/db";
import { visitsTable, alertsTable, studentsTable } from "@workspace/db";
import { eq, gte, lte, sql, desc, and } from "drizzle-orm";
import {
  GetSymptomTrendsQueryParams,
  GetClassroomHeatmapQueryParams,
  GetRecentActivityQueryParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/summary", async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const prevWeekAgo = new Date();
  prevWeekAgo.setDate(prevWeekAgo.getDate() - 14);

  const [todayVisits, weekVisits, prevWeekVisits, activeAlerts, highSeverityAlerts, studentsCount, allWeekVisits] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(visitsTable).where(gte(visitsTable.visitDate, today)),
    db.select({ count: sql<number>`count(*)` }).from(visitsTable).where(gte(visitsTable.visitDate, weekAgo)),
    db.select({ count: sql<number>`count(*)` }).from(visitsTable).where(and(gte(visitsTable.visitDate, prevWeekAgo), lte(visitsTable.visitDate, weekAgo))),
    db.select({ count: sql<number>`count(*)` }).from(alertsTable).where(eq(alertsTable.status, "active")),
    db.select({ count: sql<number>`count(*)` }).from(alertsTable).where(and(eq(alertsTable.status, "active"), eq(alertsTable.severity, "high"))),
    db.select({ count: sql<number>`count(*)` }).from(studentsTable),
    db.select().from(visitsTable).where(gte(visitsTable.visitDate, weekAgo)),
  ]);

  const symptomCounts = new Map<string, number>();
  for (const v of allWeekVisits) {
    const symptoms = JSON.parse(v.symptoms) as string[];
    for (const s of symptoms) {
      symptomCounts.set(s, (symptomCounts.get(s) ?? 0) + 1);
    }
  }
  const topSymptoms = [...symptomCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([symptom, count]) => ({ symptom, count }));

  const weekCount = Number(weekVisits[0]?.count ?? 0);
  const prevWeekCount = Number(prevWeekVisits[0]?.count ?? 0);
  const visitTrend = weekCount > prevWeekCount * 1.1 ? "up" : weekCount < prevWeekCount * 0.9 ? "down" : "stable";

  res.json({
    todayVisits: Number(todayVisits[0]?.count ?? 0),
    weekVisits: weekCount,
    activeAlerts: Number(activeAlerts[0]?.count ?? 0),
    highSeverityAlerts: Number(highSeverityAlerts[0]?.count ?? 0),
    studentsMonitored: Number(studentsCount[0]?.count ?? 0),
    topSymptoms,
    alertTrend: "stable" as const,
    visitTrend,
  });
});

router.get("/symptom-trends", async (req, res) => {
  const parsed = GetSymptomTrendsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: "Invalid query params" });
    return;
  }

  const days = Number(parsed.data.days ?? 14);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const visits = await db.select().from(visitsTable).where(gte(visitsTable.visitDate, startDate));

  const symptomDateCounts = new Map<string, Map<string, number>>();

  for (const v of visits) {
    const symptoms = JSON.parse(v.symptoms) as string[];
    const dateKey = v.visitDate.toISOString().slice(0, 10);
    for (const s of symptoms) {
      if (!symptomDateCounts.has(s)) symptomDateCounts.set(s, new Map());
      const dateMap = symptomDateCounts.get(s)!;
      dateMap.set(dateKey, (dateMap.get(dateKey) ?? 0) + 1);
    }
  }

  const topSymptoms = [...symptomDateCounts.entries()]
    .sort((a, b) => {
      const aTotal = [...a[1].values()].reduce((s, c) => s + c, 0);
      const bTotal = [...b[1].values()].reduce((s, c) => s + c, 0);
      return bTotal - aTotal;
    })
    .slice(0, 5);

  const dateKeys: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dateKeys.push(d.toISOString().slice(0, 10));
  }

  const series = topSymptoms.map(([symptom, dateMap]) => ({
    symptom,
    data: dateKeys.map((date) => ({ date, count: dateMap.get(date) ?? 0 })),
  }));

  res.json({ days, series });
});

router.get("/classroom-heatmap", async (req, res) => {
  const parsed = GetClassroomHeatmapQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: "Invalid query params" });
    return;
  }

  const days = Number(parsed.data.days ?? 7);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const visits = await db.select({
    classroom: visitsTable.classroom,
    grade: visitsTable.grade,
    symptoms: visitsTable.symptoms,
    count: sql<number>`count(*)`,
  })
    .from(visitsTable)
    .where(gte(visitsTable.visitDate, startDate))
    .groupBy(visitsTable.classroom, visitsTable.grade, visitsTable.symptoms);

  const classroomData = new Map<string, { grade: string; visitCount: number; symptoms: Map<string, number> }>();

  for (const v of visits) {
    const key = v.classroom;
    if (!classroomData.has(key)) {
      classroomData.set(key, { grade: v.grade, visitCount: 0, symptoms: new Map() });
    }
    const d = classroomData.get(key)!;
    d.visitCount += Number(v.count);
    const syms = JSON.parse(v.symptoms) as string[];
    for (const s of syms) {
      d.symptoms.set(s, (d.symptoms.get(s) ?? 0) + Number(v.count));
    }
  }

  const classrooms = [...classroomData.entries()].map(([classroom, data]) => {
    const topSymptom = [...data.symptoms.entries()].sort((a, b) => b[1] - a[1])[0];
    const riskLevel: "low" | "medium" | "high" = data.visitCount >= 8 ? "high" : data.visitCount >= 4 ? "medium" : "low";
    return {
      classroom,
      grade: data.grade,
      visitCount: data.visitCount,
      riskLevel,
      topSymptom: topSymptom ? topSymptom[0] : null,
    };
  }).sort((a, b) => b.visitCount - a.visitCount);

  res.json({ days, classrooms });
});

router.get("/recent-activity", async (req, res) => {
  const parsed = GetRecentActivityQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: "Invalid query params" });
    return;
  }

  const limit = Number(parsed.data.limit ?? 10);

  const [recentVisits, recentAlerts] = await Promise.all([
    db.select().from(visitsTable).orderBy(desc(visitsTable.visitDate)).limit(limit),
    db.select().from(alertsTable).orderBy(desc(alertsTable.createdAt)).limit(limit),
  ]);

  const activities: Array<{
    id: number;
    type: "visit" | "alert" | "resolved";
    title: string;
    description: string;
    timestamp: string;
    severity?: "low" | "medium" | "high" | null;
  }> = [];

  for (const v of recentVisits) {
    const symptoms = JSON.parse(v.symptoms) as string[];
    activities.push({
      id: v.id * 1000,
      type: "visit",
      title: `Visit logged — ${v.classroom}`,
      description: `Grade ${v.grade}: ${symptoms.join(", ")}. Action: ${v.actionTaken.replace(/_/g, " ")}`,
      timestamp: v.visitDate.toISOString(),
      severity: null,
    });
  }

  for (const a of recentAlerts) {
    activities.push({
      id: a.id,
      type: a.status === "resolved" ? "resolved" : "alert",
      title: a.title,
      description: a.description,
      timestamp: a.status === "resolved" && a.resolvedAt ? a.resolvedAt.toISOString() : a.createdAt.toISOString(),
      severity: a.severity,
    });
  }

  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  res.json({ activities: activities.slice(0, limit) });
});

export { router as dashboardRouter };
