import { pgTable, serial, text, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { studentsTable } from "./students";
import { usersTable } from "./users";

export const visitsTable = pgTable("visits", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => studentsTable.id),
  anonymousId: text("anonymous_id"),
  grade: text("grade").notNull(),
  classroom: text("classroom").notNull(),
  symptoms: text("symptoms").notNull().default("[]"),
  temperature: real("temperature"),
  notes: text("notes"),
  actionTaken: text("action_taken", {
    enum: ["sent_home", "returned_to_class", "called_parent", "referred_to_doctor", "monitored"],
  }).notNull(),
  loggedById: integer("logged_by_id").references(() => usersTable.id),
  visitDate: timestamp("visit_date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertVisitSchema = createInsertSchema(visitsTable).omit({ id: true, createdAt: true });
export type InsertVisit = z.infer<typeof insertVisitSchema>;
export type Visit = typeof visitsTable.$inferSelect;
