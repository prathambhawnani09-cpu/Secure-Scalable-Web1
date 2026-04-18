import { Router } from "express";
import { db } from "@workspace/db";
import { notificationsTable } from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";
import {
  ListNotificationsQueryParams,
  MarkNotificationReadParams,
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
  const parsed = ListNotificationsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: "Invalid query params" });
    return;
  }

  const userId = getUserFromRequest(req);
  const { unreadOnly, limit = 20 } = parsed.data;

  const conditions = [];
  if (userId) conditions.push(eq(notificationsTable.userId, userId));
  if (unreadOnly) conditions.push(eq(notificationsTable.isRead, false));

  const [notifications, unreadCountResult] = await Promise.all([
    db.select().from(notificationsTable)
      .where(and(...conditions))
      .orderBy(desc(notificationsTable.createdAt))
      .limit(Number(limit)),
    db.select({ count: sql<number>`count(*)` }).from(notificationsTable)
      .where(userId ? and(eq(notificationsTable.userId, userId), eq(notificationsTable.isRead, false)) : eq(notificationsTable.isRead, false)),
  ]);

  res.json({
    notifications: notifications.map((n) => ({
      id: n.id,
      userId: n.userId,
      title: n.title,
      message: n.message,
      type: n.type,
      isRead: n.isRead,
      alertId: n.alertId ?? null,
      createdAt: n.createdAt.toISOString(),
    })),
    unreadCount: Number(unreadCountResult[0]?.count ?? 0),
  });
});

router.post("/:id/read", async (req, res) => {
  const parsed = MarkNotificationReadParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: "Invalid ID" });
    return;
  }

  const [updated] = await db.update(notificationsTable)
    .set({ isRead: true })
    .where(eq(notificationsTable.id, parsed.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "not_found", message: "Notification not found" });
    return;
  }

  res.json({
    id: updated.id,
    userId: updated.userId,
    title: updated.title,
    message: updated.message,
    type: updated.type,
    isRead: updated.isRead,
    alertId: updated.alertId ?? null,
    createdAt: updated.createdAt.toISOString(),
  });
});

export { router as notificationsRouter };
