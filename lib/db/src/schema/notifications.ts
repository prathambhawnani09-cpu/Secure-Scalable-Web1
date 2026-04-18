import { pgTable, serial, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { alertsTable } from "./alerts";

export const notificationsTable = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type", {
    enum: ["exposure_alert", "cluster_warning", "outbreak_notice", "general"],
  }).notNull().default("general"),
  isRead: boolean("is_read").notNull().default(false),
  alertId: integer("alert_id").references(() => alertsTable.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertNotificationSchema = createInsertSchema(notificationsTable).omit({ id: true, createdAt: true });
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notificationsTable.$inferSelect;
