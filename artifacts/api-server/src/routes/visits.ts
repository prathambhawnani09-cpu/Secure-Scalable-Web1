import { Router } from "express";
import { db } from "@workspace/db";
import { visitsTable, studentsTable, usersTable } from "@workspace/db";
import { eq, and, gte, lte, sql, ilike, desc } from "drizzle-orm";
import {
  ListVisitsQueryParams,
  CreateVisitBody,
  GetVisitParams,
} from "@workspace/api-zod";
import { tokenStore } from "./auth";

const router = Router();

function getUserFromRequest(req: any): number | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  return tokenStore.get(token) ?? null;
}

router.get("/", async (req, res) => {
  const parsed = ListVisitsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: "Invalid query params" });
    return;
  }

  const { startDate, endDate, grade, classroom, symptom, limit = 50, offset = 0 } = parsed.data;

  const conditions = [];
  if (startDate) conditions.push(gte(visitsTable.visitDate, new Date(startDate)));
  if (endDate) conditions.push(lte(visitsTable.visitDate, new Date(endDate)));
  if (grade) conditions.push(eq(visitsTable.grade, grade));
  if (classroom) conditions.push(eq(visitsTable.classroom, classroom));
  if (symptom) conditions.push(ilike(visitsTable.symptoms, `%${symptom}%`));

  const [rows, countRows] = await Promise.all([
    db.select().from(visitsTable)
      .leftJoin(studentsTable, eq(visitsTable.studentId, studentsTable.id))
      .leftJoin(usersTable, eq(visitsTable.loggedById, usersTable.id))
      .where(and(...conditions))
      .orderBy(desc(visitsTable.visitDate))
      .limit(Number(limit))
      .offset(Number(offset)),
    db.select({ count: sql<number>`count(*)` }).from(visitsTable).where(and(...conditions)),
  ]);

  const visits = rows.map((r) => ({
    id: r.visits.id,
    studentId: r.visits.studentId ?? 0,
    studentName: r.students?.name ?? "Anonymous",
    grade: r.visits.grade,
    classroom: r.visits.classroom,
    symptoms: JSON.parse(r.visits.symptoms) as string[],
    temperature: r.visits.temperature ?? null,
    notes: r.visits.notes ?? null,
    actionTaken: r.visits.actionTaken,
    visitDate: r.visits.visitDate.toISOString(),
    loggedBy: r.users?.name ?? "Unknown",
    createdAt: r.visits.createdAt.toISOString(),
  }));

  res.json({
    visits,
    total: Number(countRows[0]?.count ?? 0),
    limit: Number(limit),
    offset: Number(offset),
  });
});

router.post("/", async (req, res) => {
  const parsed = CreateVisitBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: "Invalid request body" });
    return;
  }

  const loggedById = getUserFromRequest(req);
  const data = parsed.data;

  const [inserted] = await db.insert(visitsTable).values({
    studentId: data.studentId ?? null,
    anonymousId: data.anonymousId ?? null,
    grade: data.grade,
    classroom: data.classroom,
    symptoms: JSON.stringify(data.symptoms),
    temperature: data.temperature ?? null,
    notes: data.notes ?? null,
    actionTaken: data.actionTaken,
    loggedById: loggedById ?? null,
    visitDate: new Date(),
  }).returning();

  let studentName = "Anonymous";
  if (inserted.studentId) {
    const students = await db.select().from(studentsTable).where(eq(studentsTable.id, inserted.studentId)).limit(1);
    if (students[0]) studentName = students[0].name;
  }

  let loggedByName = "Unknown";
  if (loggedById) {
    const users = await db.select().from(usersTable).where(eq(usersTable.id, loggedById)).limit(1);
    if (users[0]) loggedByName = users[0].name;
  }

  await runOutbreakDetection(inserted.grade, inserted.classroom);

  res.status(201).json({
    id: inserted.id,
    studentId: inserted.studentId ?? 0,
    studentName,
    grade: inserted.grade,
    classroom: inserted.classroom,
    symptoms: JSON.parse(inserted.symptoms) as string[],
    temperature: inserted.temperature ?? null,
    notes: inserted.notes ?? null,
    actionTaken: inserted.actionTaken,
    visitDate: inserted.visitDate.toISOString(),
    loggedBy: loggedByName,
    createdAt: inserted.createdAt.toISOString(),
  });
});

router.get("/:id", async (req, res) => {
  const parsed = GetVisitParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: "Invalid ID" });
    return;
  }

  const rows = await db.select().from(visitsTable)
    .leftJoin(studentsTable, eq(visitsTable.studentId, studentsTable.id))
    .leftJoin(usersTable, eq(visitsTable.loggedById, usersTable.id))
    .where(eq(visitsTable.id, parsed.data.id))
    .limit(1);

  const r = rows[0];
  if (!r) {
    res.status(404).json({ error: "not_found", message: "Visit not found" });
    return;
  }

  res.json({
    id: r.visits.id,
    studentId: r.visits.studentId ?? 0,
    studentName: r.students?.name ?? "Anonymous",
    grade: r.visits.grade,
    classroom: r.visits.classroom,
    symptoms: JSON.parse(r.visits.symptoms) as string[],
    temperature: r.visits.temperature ?? null,
    notes: r.visits.notes ?? null,
    actionTaken: r.visits.actionTaken,
    visitDate: r.visits.visitDate.toISOString(),
    loggedBy: r.users?.name ?? "Unknown",
    createdAt: r.visits.createdAt.toISOString(),
  });
});

async function runOutbreakDetection(grade: string, classroom: string) {
  const { alertsTable } = await import("@workspace/db");
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentVisits = await db.select().from(visitsTable)
    .where(and(
      eq(visitsTable.classroom, classroom),
      gte(visitsTable.visitDate, sevenDaysAgo)
    ));

  if (recentVisits.length < 3) return;

  const symptomCounts = new Map<string, number>();
  for (const v of recentVisits) {
    const symptoms = JSON.parse(v.symptoms) as string[];
    for (const s of symptoms) {
      symptomCounts.set(s, (symptomCounts.get(s) ?? 0) + 1);
    }
  }

  const topSymptom = [...symptomCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (!topSymptom || topSymptom[1] < 3) return;

  const existingAlerts = await db.select().from(alertsTable)
    .where(and(
      eq(alertsTable.affectedClassroom, classroom),
      eq(alertsTable.status, "active")
    ));

  if (existingAlerts.length > 0) return;

  const severity = recentVisits.length >= 8 ? "high" : recentVisits.length >= 5 ? "medium" : "low";
  const type = recentVisits.length >= 8 ? "possible_outbreak" : "cluster_detected";

  await db.insert(alertsTable).values({
    type,
    severity,
    status: "active",
    title: `${severity === "high" ? "Possible Outbreak" : "Symptom Cluster"} in ${classroom}`,
    description: `${recentVisits.length} students from ${classroom} (Grade ${grade}) reported ${topSymptom[0]} in the past 7 days. Pattern may indicate ${type === "possible_outbreak" ? "an outbreak" : "a developing cluster"}.`,
    affectedClassroom: classroom,
    affectedGrade: grade,
    affectedCount: recentVisits.length,
    symptoms: JSON.stringify([topSymptom[0]]),
  });
}

export { router as visitsRouter };
