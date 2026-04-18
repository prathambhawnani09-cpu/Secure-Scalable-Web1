import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const alertsTable = pgTable("alerts", {
  id: serial("id").primaryKey(),
  type: text("type", {
    enum: ["cluster_detected", "possible_outbreak", "chronic_absenteeism_risk", "elevated_symptoms"],
  }).notNull(),
  severity: text("severity", { enum: ["low", "medium", "high"] }).notNull(),
  status: text("status", { enum: ["active", "resolved"] }).notNull().default("active"),
  title: text("title").notNull(),
  description: text("description").notNull(),
  affectedClassroom: text("affected_classroom"),
  affectedGrade: text("affected_grade"),
  affectedCount: integer("affected_count").notNull().default(0),
  symptoms: text("symptoms").notNull().default("[]"),
  schoolId: integer("school_id").notNull().default(1),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: text("resolved_by"),
  resolutionNote: text("resolution_note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAlertSchema = createInsertSchema(alertsTable).omit({ id: true, createdAt: true });
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alertsTable.$inferSelect;
