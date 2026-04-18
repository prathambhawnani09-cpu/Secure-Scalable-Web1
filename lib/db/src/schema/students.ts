import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const studentsTable = pgTable("students", {
  id: serial("id").primaryKey(),
  studentCode: text("student_code").notNull().unique(),
  name: text("name").notNull(),
  grade: text("grade").notNull(),
  classroom: text("classroom").notNull(),
  dateOfBirth: text("date_of_birth"),
  parentEmail: text("parent_email"),
  parentPhone: text("parent_phone"),
  chronicConditions: text("chronic_conditions").notNull().default("[]"),
  allergies: text("allergies").notNull().default("[]"),
  schoolId: integer("school_id").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertStudentSchema = createInsertSchema(studentsTable).omit({ id: true, createdAt: true });
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof studentsTable.$inferSelect;
