import { Router } from "express";
import { db } from "@workspace/db";
import { studentsTable, visitsTable } from "@workspace/db";
import { eq, and, ilike, sql, desc } from "drizzle-orm";
import {
  ListStudentsQueryParams,
  CreateStudentBody,
  GetStudentParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  const parsed = ListStudentsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: "Invalid query params" });
    return;
  }

  const { grade, classroom, search } = parsed.data;

  const conditions = [];
  if (grade) conditions.push(eq(studentsTable.grade, grade));
  if (classroom) conditions.push(eq(studentsTable.classroom, classroom));
  if (search) conditions.push(ilike(studentsTable.name, `%${search}%`));

  const students = await db.select({
    student: studentsTable,
    visitCount: sql<number>`count(${visitsTable.id})`,
    lastVisitDate: sql<string>`max(${visitsTable.visitDate})`,
  })
    .from(studentsTable)
    .leftJoin(visitsTable, eq(visitsTable.studentId, studentsTable.id))
    .where(and(...conditions))
    .groupBy(studentsTable.id)
    .orderBy(studentsTable.name);

  const result = students.map((r) => ({
    id: r.student.id,
    studentCode: r.student.studentCode,
    name: r.student.name,
    grade: r.student.grade,
    classroom: r.student.classroom,
    dateOfBirth: r.student.dateOfBirth ?? null,
    parentEmail: r.student.parentEmail ?? null,
    parentPhone: r.student.parentPhone ?? null,
    chronicConditions: JSON.parse(r.student.chronicConditions) as string[],
    allergies: JSON.parse(r.student.allergies) as string[],
    visitCount: Number(r.visitCount),
    lastVisitDate: r.lastVisitDate ? new Date(r.lastVisitDate).toISOString() : null,
    createdAt: r.student.createdAt.toISOString(),
  }));

  res.json({ students: result, total: result.length });
});

router.post("/", async (req, res) => {
  const parsed = CreateStudentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: "Invalid request body" });
    return;
  }

  const data = parsed.data;
  const studentCode = `STU${Date.now().toString().slice(-6)}`;

  const [inserted] = await db.insert(studentsTable).values({
    studentCode,
    name: data.name,
    grade: data.grade,
    classroom: data.classroom,
    dateOfBirth: data.dateOfBirth ?? null,
    parentEmail: data.parentEmail ?? null,
    parentPhone: data.parentPhone ?? null,
    chronicConditions: JSON.stringify(data.chronicConditions ?? []),
    allergies: JSON.stringify(data.allergies ?? []),
  }).returning();

  res.status(201).json({
    id: inserted.id,
    studentCode: inserted.studentCode,
    name: inserted.name,
    grade: inserted.grade,
    classroom: inserted.classroom,
    dateOfBirth: inserted.dateOfBirth ?? null,
    parentEmail: inserted.parentEmail ?? null,
    parentPhone: inserted.parentPhone ?? null,
    chronicConditions: JSON.parse(inserted.chronicConditions) as string[],
    allergies: JSON.parse(inserted.allergies) as string[],
    visitCount: 0,
    lastVisitDate: null,
    createdAt: inserted.createdAt.toISOString(),
  });
});

router.get("/:id", async (req, res) => {
  const parsed = GetStudentParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: "Invalid ID" });
    return;
  }

  const students = await db.select().from(studentsTable).where(eq(studentsTable.id, parsed.data.id)).limit(1);
  const student = students[0];

  if (!student) {
    res.status(404).json({ error: "not_found", message: "Student not found" });
    return;
  }

  const [visitCountResult, recentVisitsRaw] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(visitsTable).where(eq(visitsTable.studentId, student.id)),
    db.select().from(visitsTable).where(eq(visitsTable.studentId, student.id)).orderBy(desc(visitsTable.visitDate)).limit(10),
  ]);

  const visitCount = Number(visitCountResult[0]?.count ?? 0);
  const riskScore = Math.min(100, visitCount * 8);

  const recentVisits = recentVisitsRaw.map((v) => ({
    id: v.id,
    studentId: v.studentId ?? 0,
    studentName: student.name,
    grade: v.grade,
    classroom: v.classroom,
    symptoms: JSON.parse(v.symptoms) as string[],
    temperature: v.temperature ?? null,
    notes: v.notes ?? null,
    actionTaken: v.actionTaken,
    visitDate: v.visitDate.toISOString(),
    loggedBy: "Nurse",
    createdAt: v.createdAt.toISOString(),
  }));

  res.json({
    student: {
      id: student.id,
      studentCode: student.studentCode,
      name: student.name,
      grade: student.grade,
      classroom: student.classroom,
      dateOfBirth: student.dateOfBirth ?? null,
      parentEmail: student.parentEmail ?? null,
      parentPhone: student.parentPhone ?? null,
      chronicConditions: JSON.parse(student.chronicConditions) as string[],
      allergies: JSON.parse(student.allergies) as string[],
      visitCount,
      lastVisitDate: recentVisitsRaw[0]?.visitDate.toISOString() ?? null,
      createdAt: student.createdAt.toISOString(),
    },
    recentVisits,
    riskScore,
  });
});

export { router as studentsRouter };
