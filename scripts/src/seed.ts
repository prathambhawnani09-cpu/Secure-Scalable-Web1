import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import crypto from "crypto";
import {
  usersTable,
  studentsTable,
  visitsTable,
  alertsTable,
  notificationsTable,
} from "../../lib/db/src/schema/index.js";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

function hashPassword(password: string): string {
  return crypto
    .createHash("sha256")
    .update(password + "schoolhealth_salt")
    .digest("hex");
}

async function seed() {
  console.log("Seeding database...");

  const existingUsers = await db.select().from(usersTable).limit(1);
  if (existingUsers.length > 0) {
    console.log("Database already seeded, skipping.");
    await pool.end();
    return;
  }

  const passwordHash = hashPassword("password123");

  const [nurse] = await db
    .insert(usersTable)
    .values([
      {
        email: "nurse@demo.school",
        passwordHash,
        name: "Sarah Johnson",
        role: "nurse",
        schoolId: 1,
      },
      {
        email: "admin@demo.school",
        passwordHash,
        name: "Principal Martinez",
        role: "admin",
        schoolId: 1,
      },
      {
        email: "parent@demo.school",
        passwordHash,
        name: "Alex Parent",
        role: "parent",
        schoolId: 1,
      },
    ])
    .returning();

  console.log("Created users");

  const students = await db
    .insert(studentsTable)
    .values([
      {
        studentCode: "STU001",
        name: "Emma Wilson",
        grade: "5",
        classroom: "5B",
        dateOfBirth: "2013-03-15",
        parentEmail: "parent@demo.school",
        parentPhone: "555-0101",
        chronicConditions: JSON.stringify(["asthma"]),
        allergies: JSON.stringify(["peanuts"]),
        schoolId: 1,
      },
      {
        studentCode: "STU002",
        name: "Liam Garcia",
        grade: "5",
        classroom: "5B",
        dateOfBirth: "2013-07-22",
        parentEmail: "liam.parent@demo.school",
        parentPhone: "555-0102",
        chronicConditions: JSON.stringify([]),
        allergies: JSON.stringify([]),
        schoolId: 1,
      },
      {
        studentCode: "STU003",
        name: "Olivia Chen",
        grade: "5",
        classroom: "5B",
        dateOfBirth: "2013-01-10",
        parentEmail: "olivia.parent@demo.school",
        parentPhone: "555-0103",
        chronicConditions: JSON.stringify([]),
        allergies: JSON.stringify(["dairy"]),
        schoolId: 1,
      },
      {
        studentCode: "STU004",
        name: "Noah Kim",
        grade: "5",
        classroom: "5B",
        dateOfBirth: "2013-09-05",
        parentEmail: "noah.parent@demo.school",
        parentPhone: "555-0104",
        chronicConditions: JSON.stringify(["eczema"]),
        allergies: JSON.stringify([]),
        schoolId: 1,
      },
      {
        studentCode: "STU005",
        name: "Ava Thompson",
        grade: "5",
        classroom: "5B",
        dateOfBirth: "2013-05-18",
        parentEmail: "ava.parent@demo.school",
        parentPhone: "555-0105",
        chronicConditions: JSON.stringify([]),
        allergies: JSON.stringify([]),
        schoolId: 1,
      },
      {
        studentCode: "STU006",
        name: "James Rodriguez",
        grade: "3",
        classroom: "3A",
        dateOfBirth: "2015-11-30",
        parentEmail: "james.parent@demo.school",
        parentPhone: "555-0106",
        chronicConditions: JSON.stringify([]),
        allergies: JSON.stringify([]),
        schoolId: 1,
      },
      {
        studentCode: "STU007",
        name: "Sophia Martinez",
        grade: "3",
        classroom: "3A",
        dateOfBirth: "2015-04-12",
        parentEmail: "sophia.parent@demo.school",
        parentPhone: "555-0107",
        chronicConditions: JSON.stringify([]),
        allergies: JSON.stringify([]),
        schoolId: 1,
      },
      {
        studentCode: "STU008",
        name: "Benjamin Lee",
        grade: "3",
        classroom: "3A",
        dateOfBirth: "2015-08-25",
        parentEmail: "benjamin.parent@demo.school",
        parentPhone: "555-0108",
        chronicConditions: JSON.stringify(["diabetes"]),
        allergies: JSON.stringify([]),
        schoolId: 1,
      },
      {
        studentCode: "STU009",
        name: "Mia Johnson",
        grade: "2",
        classroom: "2C",
        dateOfBirth: "2016-02-14",
        parentEmail: "mia.parent@demo.school",
        parentPhone: "555-0109",
        chronicConditions: JSON.stringify([]),
        allergies: JSON.stringify(["shellfish"]),
        schoolId: 1,
      },
      {
        studentCode: "STU010",
        name: "Lucas Brown",
        grade: "2",
        classroom: "2C",
        dateOfBirth: "2016-06-20",
        parentEmail: "lucas.parent@demo.school",
        parentPhone: "555-0110",
        chronicConditions: JSON.stringify([]),
        allergies: JSON.stringify([]),
        schoolId: 1,
      },
      {
        studentCode: "STU011",
        name: "Charlotte Davis",
        grade: "4",
        classroom: "4D",
        dateOfBirth: "2014-09-08",
        parentEmail: "charlotte.parent@demo.school",
        parentPhone: "555-0111",
        chronicConditions: JSON.stringify([]),
        allergies: JSON.stringify([]),
        schoolId: 1,
      },
      {
        studentCode: "STU012",
        name: "Henry Wilson",
        grade: "4",
        classroom: "4D",
        dateOfBirth: "2014-12-01",
        parentEmail: "henry.parent@demo.school",
        parentPhone: "555-0112",
        chronicConditions: JSON.stringify([]),
        allergies: JSON.stringify([]),
        schoolId: 1,
      },
      {
        studentCode: "STU013",
        name: "Amelia Taylor",
        grade: "1",
        classroom: "1B",
        dateOfBirth: "2017-03-22",
        parentEmail: "amelia.parent@demo.school",
        parentPhone: "555-0113",
        chronicConditions: JSON.stringify([]),
        allergies: JSON.stringify([]),
        schoolId: 1,
      },
      {
        studentCode: "STU014",
        name: "Sebastian Anderson",
        grade: "1",
        classroom: "1B",
        dateOfBirth: "2017-07-14",
        parentEmail: "sebastian.parent@demo.school",
        parentPhone: "555-0114",
        chronicConditions: JSON.stringify([]),
        allergies: JSON.stringify([]),
        schoolId: 1,
      },
      {
        studentCode: "STU015",
        name: "Harper Jackson",
        grade: "K",
        classroom: "K1",
        dateOfBirth: "2018-01-09",
        parentEmail: "harper.parent@demo.school",
        parentPhone: "555-0115",
        chronicConditions: JSON.stringify([]),
        allergies: JSON.stringify([]),
        schoolId: 1,
      },
    ])
    .returning();

  console.log("Created students");

  const nurseUser = await db.select().from(usersTable).limit(1);
  const nurseId = nurseUser[0].id;

  const now = new Date();
  const daysAgo = (d: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    return date;
  };

  await db.insert(visitsTable).values([
    {
      studentId: students[0].id,
      grade: "5",
      classroom: "5B",
      symptoms: JSON.stringify(["fever", "headache", "nausea"]),
      temperature: 101.2,
      notes: "Student came in feeling unwell, sent home",
      actionTaken: "sent_home",
      loggedById: nurseId,
      visitDate: daysAgo(1),
    },
    {
      studentId: students[1].id,
      grade: "5",
      classroom: "5B",
      symptoms: JSON.stringify(["fever", "sore_throat", "cough"]),
      temperature: 100.8,
      notes: "Similar symptoms to other 5B students",
      actionTaken: "sent_home",
      loggedById: nurseId,
      visitDate: daysAgo(2),
    },
    {
      studentId: students[2].id,
      grade: "5",
      classroom: "5B",
      symptoms: JSON.stringify(["fever", "headache", "fatigue"]),
      temperature: 102.1,
      notes: "High fever, parent called",
      actionTaken: "called_parent",
      loggedById: nurseId,
      visitDate: daysAgo(2),
    },
    {
      studentId: students[3].id,
      grade: "5",
      classroom: "5B",
      symptoms: JSON.stringify(["nausea", "stomach_pain", "headache"]),
      temperature: 99.5,
      notes: "Mild symptoms, returned to class after resting",
      actionTaken: "returned_to_class",
      loggedById: nurseId,
      visitDate: daysAgo(3),
    },
    {
      studentId: students[4].id,
      grade: "5",
      classroom: "5B",
      symptoms: JSON.stringify(["fever", "cough", "sore_throat"]),
      temperature: 101.5,
      notes: "Coughing frequently, sent home",
      actionTaken: "sent_home",
      loggedById: nurseId,
      visitDate: daysAgo(3),
    },
    {
      studentId: students[5].id,
      grade: "3",
      classroom: "3A",
      symptoms: JSON.stringify(["stomach_pain", "nausea"]),
      temperature: 98.9,
      notes: "Upset stomach, monitored for an hour",
      actionTaken: "monitored",
      loggedById: nurseId,
      visitDate: daysAgo(4),
    },
    {
      studentId: students[6].id,
      grade: "3",
      classroom: "3A",
      symptoms: JSON.stringify(["headache"]),
      temperature: null,
      notes: "Mild headache, returned to class",
      actionTaken: "returned_to_class",
      loggedById: nurseId,
      visitDate: daysAgo(4),
    },
    {
      studentId: students[7].id,
      grade: "3",
      classroom: "3A",
      symptoms: JSON.stringify(["stomach_pain", "nausea", "fatigue"]),
      temperature: 99.1,
      notes: "Possible stomach virus, sent home",
      actionTaken: "sent_home",
      loggedById: nurseId,
      visitDate: daysAgo(5),
    },
    {
      studentId: students[8].id,
      grade: "2",
      classroom: "2C",
      symptoms: JSON.stringify(["rash", "itching"]),
      temperature: 98.6,
      notes: "Possible allergic reaction, parent notified",
      actionTaken: "called_parent",
      loggedById: nurseId,
      visitDate: daysAgo(5),
    },
    {
      studentId: students[9].id,
      grade: "2",
      classroom: "2C",
      symptoms: JSON.stringify(["cough", "runny_nose"]),
      temperature: null,
      notes: "Cold symptoms, returned to class",
      actionTaken: "returned_to_class",
      loggedById: nurseId,
      visitDate: daysAgo(6),
    },
    {
      studentId: students[10].id,
      grade: "4",
      classroom: "4D",
      symptoms: JSON.stringify(["headache", "fatigue"]),
      temperature: 98.8,
      notes: "Complained of tiredness, monitored",
      actionTaken: "monitored",
      loggedById: nurseId,
      visitDate: daysAgo(1),
    },
    {
      studentId: students[11].id,
      grade: "4",
      classroom: "4D",
      symptoms: JSON.stringify(["cough", "sore_throat"]),
      temperature: 99.2,
      notes: "Early cold symptoms",
      actionTaken: "returned_to_class",
      loggedById: nurseId,
      visitDate: daysAgo(2),
    },
    {
      studentId: students[12].id,
      grade: "1",
      classroom: "1B",
      symptoms: JSON.stringify(["fever"]),
      temperature: 101.0,
      notes: "Fever developed during lunch",
      actionTaken: "sent_home",
      loggedById: nurseId,
      visitDate: daysAgo(0),
    },
    {
      studentId: students[13].id,
      grade: "1",
      classroom: "1B",
      symptoms: JSON.stringify(["stomach_pain"]),
      temperature: null,
      notes: "Stomach ache before lunch",
      actionTaken: "monitored",
      loggedById: nurseId,
      visitDate: daysAgo(1),
    },
  ]);

  console.log("Created visits");

  const [alert1, alert2, alert3] = await db
    .insert(alertsTable)
    .values([
      {
        type: "possible_outbreak",
        severity: "high",
        status: "active",
        title: "Possible Flu Outbreak - Class 5B",
        description:
          "5 students from classroom 5B have reported fever, headache, and respiratory symptoms within the last 7 days. This pattern suggests a possible influenza outbreak. Immediate action recommended.",
        affectedClassroom: "5B",
        affectedGrade: "5",
        affectedCount: 5,
        symptoms: JSON.stringify(["fever", "headache", "cough", "sore_throat", "nausea"]),
        schoolId: 1,
      },
      {
        type: "cluster_detected",
        severity: "medium",
        status: "active",
        title: "Symptom Cluster Detected - Class 3A",
        description:
          "3 students from classroom 3A have reported gastrointestinal symptoms (stomach pain, nausea) in the past 5 days. This may indicate a stomach virus. Monitor closely.",
        affectedClassroom: "3A",
        affectedGrade: "3",
        affectedCount: 3,
        symptoms: JSON.stringify(["stomach_pain", "nausea", "fatigue"]),
        schoolId: 1,
      },
      {
        type: "elevated_symptoms",
        severity: "low",
        status: "resolved",
        title: "Elevated Respiratory Symptoms - Class 2C",
        description:
          "2 students from classroom 2C reported respiratory symptoms. Situation has been monitored and resolved.",
        affectedClassroom: "2C",
        affectedGrade: "2",
        affectedCount: 2,
        symptoms: JSON.stringify(["cough", "runny_nose"]),
        schoolId: 1,
        resolvedAt: daysAgo(1),
        resolvedBy: "Principal Martinez",
        resolutionNote:
          "Symptoms were mild and unrelated. Students recovered fully.",
      },
    ])
    .returning();

  console.log("Created alerts");

  const parentUser = await db.select().from(usersTable).where().limit(3);
  const allUsers = await db.select().from(usersTable);
  const parent = allUsers.find((u) => u.role === "parent");

  if (parent) {
    await db.insert(notificationsTable).values([
      {
        userId: parent.id,
        title: "Possible Outbreak: Class 5B",
        message:
          "A possible flu outbreak has been detected in Class 5B. 5 students have reported fever and respiratory symptoms. Please monitor all contacts for symptoms and take appropriate precautions.",
        type: "outbreak_notice",
        isRead: false,
        alertId: alert1.id,
      },
      {
        userId: parent.id,
        title: "Exposure Notice: Gastrointestinal Illness",
        message:
          "Students in Class 3A may have been exposed to a gastrointestinal illness. Watch for symptoms like stomach pain, nausea, or vomiting over the next 48 hours. Contact the school nurse if symptoms develop.",
        type: "exposure_alert",
        isRead: false,
        alertId: alert2.id,
      },
      {
        userId: parent.id,
        title: "Cluster Warning Resolved",
        message:
          "The respiratory symptom cluster reported in Class 2C has been resolved. All affected students have recovered. No further action needed.",
        type: "cluster_warning",
        isRead: true,
        alertId: alert3.id,
      },
    ]);
  }

  console.log("Created notifications");
  console.log("Seeding complete!");
  await pool.end();
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
