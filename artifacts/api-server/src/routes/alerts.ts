import { Router } from "express";
import { db } from "@workspace/db";
import { alertsTable } from "@workspace/db";
import { eq, and, sql, desc } from "drizzle-orm";
import {
  ListAlertsQueryParams,
  GetAlertParams,
  ResolveAlertParams,
  ResolveAlertBody,
} from "@workspace/api-zod";
import { tokenStore } from "./auth";
import { usersTable } from "@workspace/db";

const router = Router();

router.get("/", async (req, res) => {
  const parsed = ListAlertsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: "Invalid query params" });
    return;
  }

  const { status, severity, limit = 20 } = parsed.data;

  const conditions = [];
  if (status && status !== "all") conditions.push(eq(alertsTable.status, status));
  if (severity) conditions.push(eq(alertsTable.severity, severity));

  const [alerts, countResult, activeCountResult] = await Promise.all([
    db.select().from(alertsTable)
      .where(and(...conditions))
      .orderBy(desc(alertsTable.createdAt))
      .limit(Number(limit)),
    db.select({ count: sql<number>`count(*)` }).from(alertsTable).where(and(...conditions)),
    db.select({ count: sql<number>`count(*)` }).from(alertsTable).where(eq(alertsTable.status, "active")),
  ]);

  res.json({
    alerts: alerts.map(formatAlert),
    total: Number(countResult[0]?.count ?? 0),
    activeCount: Number(activeCountResult[0]?.count ?? 0),
  });
});

router.get("/:id", async (req, res) => {
  const parsed = GetAlertParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: "Invalid ID" });
    return;
  }

  const alerts = await db.select().from(alertsTable).where(eq(alertsTable.id, parsed.data.id)).limit(1);
  const alert = alerts[0];

  if (!alert) {
    res.status(404).json({ error: "not_found", message: "Alert not found" });
    return;
  }

  res.json(formatAlert(alert));
});

router.post("/:id/resolve", async (req, res) => {
  const paramsParsed = ResolveAlertParams.safeParse({ id: Number(req.params.id) });
  const bodyParsed = ResolveAlertBody.safeParse(req.body);

  if (!paramsParsed.success || !bodyParsed.success) {
    res.status(400).json({ error: "validation_error", message: "Invalid request" });
    return;
  }

  const authHeader = req.headers.authorization;
  let resolvedByName = "Admin";
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const userId = tokenStore.get(authHeader.slice(7));
    if (userId) {
      const users = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
      if (users[0]) resolvedByName = users[0].name;
    }
  }

  const [updated] = await db.update(alertsTable)
    .set({
      status: "resolved",
      resolvedAt: new Date(),
      resolvedBy: resolvedByName,
      resolutionNote: bodyParsed.data.note,
    })
    .where(eq(alertsTable.id, paramsParsed.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "not_found", message: "Alert not found" });
    return;
  }

  res.json(formatAlert(updated));
});

function formatAlert(a: typeof alertsTable.$inferSelect) {
  return {
    id: a.id,
    type: a.type,
    severity: a.severity,
    status: a.status,
    title: a.title,
    description: a.description,
    affectedClassroom: a.affectedClassroom ?? null,
    affectedGrade: a.affectedGrade ?? null,
    affectedCount: a.affectedCount,
    symptoms: JSON.parse(a.symptoms) as string[],
    resolvedAt: a.resolvedAt?.toISOString() ?? null,
    resolvedBy: a.resolvedBy ?? null,
    resolutionNote: a.resolutionNote ?? null,
    createdAt: a.createdAt.toISOString(),
  };
}

export { router as alertsRouter };
