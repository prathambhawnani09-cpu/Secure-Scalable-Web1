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

const now = new Date();
const daysAgo = (d: number, offsetHours = 0) => {
  const date = new Date(now);
  date.setDate(date.getDate() - d);
  date.setHours(8 + offsetHours, 0, 0, 0);
  return date;
};

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
      { email: "nurse@demo.school", passwordHash, name: "Sarah Johnson", role: "nurse", schoolId: 1 },
      { email: "admin@demo.school", passwordHash, name: "Principal Martinez", role: "admin", schoolId: 1 },
      { email: "parent@demo.school", passwordHash, name: "Alex Parent", role: "parent", schoolId: 1 },
    ])
    .returning();

  console.log("Created users");

  const students = await db.insert(studentsTable).values([
    // Class 5B — flu cluster
    { studentCode: "STU001", name: "Emma Wilson",      grade: "5", classroom: "5B", dateOfBirth: "2013-03-15", parentEmail: "parent@demo.school",         parentPhone: "555-0101", chronicConditions: JSON.stringify(["asthma"]),    allergies: JSON.stringify(["peanuts"]),   schoolId: 1 },
    { studentCode: "STU002", name: "Liam Garcia",      grade: "5", classroom: "5B", dateOfBirth: "2013-07-22", parentEmail: "liam.parent@demo.school",     parentPhone: "555-0102", chronicConditions: JSON.stringify([]),            allergies: JSON.stringify([]),            schoolId: 1 },
    { studentCode: "STU003", name: "Olivia Chen",      grade: "5", classroom: "5B", dateOfBirth: "2013-01-10", parentEmail: "olivia.parent@demo.school",   parentPhone: "555-0103", chronicConditions: JSON.stringify([]),            allergies: JSON.stringify(["dairy"]),     schoolId: 1 },
    { studentCode: "STU004", name: "Noah Kim",         grade: "5", classroom: "5B", dateOfBirth: "2013-09-05", parentEmail: "noah.parent@demo.school",     parentPhone: "555-0104", chronicConditions: JSON.stringify(["eczema"]),   allergies: JSON.stringify([]),            schoolId: 1 },
    { studentCode: "STU005", name: "Ava Thompson",     grade: "5", classroom: "5B", dateOfBirth: "2013-05-18", parentEmail: "ava.parent@demo.school",      parentPhone: "555-0105", chronicConditions: JSON.stringify([]),            allergies: JSON.stringify([]),            schoolId: 1 },
    { studentCode: "STU006", name: "Mason Clark",      grade: "5", classroom: "5B", dateOfBirth: "2013-11-02", parentEmail: "mason.parent@demo.school",    parentPhone: "555-0106", chronicConditions: JSON.stringify([]),            allergies: JSON.stringify([]),            schoolId: 1 },
    // Class 3A — stomach virus cluster
    { studentCode: "STU007", name: "James Rodriguez",  grade: "3", classroom: "3A", dateOfBirth: "2015-11-30", parentEmail: "james.parent@demo.school",    parentPhone: "555-0107", chronicConditions: JSON.stringify([]),            allergies: JSON.stringify([]),            schoolId: 1 },
    { studentCode: "STU008", name: "Sophia Martinez",  grade: "3", classroom: "3A", dateOfBirth: "2015-04-12", parentEmail: "sophia.parent@demo.school",   parentPhone: "555-0108", chronicConditions: JSON.stringify([]),            allergies: JSON.stringify([]),            schoolId: 1 },
    { studentCode: "STU009", name: "Benjamin Lee",     grade: "3", classroom: "3A", dateOfBirth: "2015-08-25", parentEmail: "benjamin.parent@demo.school", parentPhone: "555-0109", chronicConditions: JSON.stringify(["diabetes"]), allergies: JSON.stringify([]),            schoolId: 1 },
    { studentCode: "STU010", name: "Isabella Hall",    grade: "3", classroom: "3A", dateOfBirth: "2015-06-14", parentEmail: "isabella.parent@demo.school", parentPhone: "555-0110", chronicConditions: JSON.stringify([]),            allergies: JSON.stringify([]),            schoolId: 1 },
    // Class 2C — respiratory symptoms
    { studentCode: "STU011", name: "Mia Johnson",      grade: "2", classroom: "2C", dateOfBirth: "2016-02-14", parentEmail: "mia.parent@demo.school",      parentPhone: "555-0111", chronicConditions: JSON.stringify([]),            allergies: JSON.stringify(["shellfish"]), schoolId: 1 },
    { studentCode: "STU012", name: "Lucas Brown",      grade: "2", classroom: "2C", dateOfBirth: "2016-06-20", parentEmail: "lucas.parent@demo.school",    parentPhone: "555-0112", chronicConditions: JSON.stringify([]),            allergies: JSON.stringify([]),            schoolId: 1 },
    { studentCode: "STU013", name: "Aria Scott",       grade: "2", classroom: "2C", dateOfBirth: "2016-09-03", parentEmail: "aria.parent@demo.school",     parentPhone: "555-0113", chronicConditions: JSON.stringify([]),            allergies: JSON.stringify([]),            schoolId: 1 },
    // Class 4D — mixed symptoms
    { studentCode: "STU014", name: "Charlotte Davis",  grade: "4", classroom: "4D", dateOfBirth: "2014-09-08", parentEmail: "charlotte.parent@demo.school",parentPhone: "555-0114", chronicConditions: JSON.stringify([]),            allergies: JSON.stringify([]),            schoolId: 1 },
    { studentCode: "STU015", name: "Henry Wilson",     grade: "4", classroom: "4D", dateOfBirth: "2014-12-01", parentEmail: "henry.parent@demo.school",    parentPhone: "555-0115", chronicConditions: JSON.stringify([]),            allergies: JSON.stringify([]),            schoolId: 1 },
    { studentCode: "STU016", name: "Zoe Adams",        grade: "4", classroom: "4D", dateOfBirth: "2014-04-22", parentEmail: "zoe.parent@demo.school",      parentPhone: "555-0116", chronicConditions: JSON.stringify([]),            allergies: JSON.stringify([]),            schoolId: 1 },
    { studentCode: "STU017", name: "Ethan Walker",     grade: "4", classroom: "4D", dateOfBirth: "2014-08-11", parentEmail: "ethan.parent@demo.school",    parentPhone: "555-0117", chronicConditions: JSON.stringify([]),            allergies: JSON.stringify([]),            schoolId: 1 },
    // Class 1B — kindergarten
    { studentCode: "STU018", name: "Amelia Taylor",    grade: "1", classroom: "1B", dateOfBirth: "2017-03-22", parentEmail: "amelia.parent@demo.school",   parentPhone: "555-0118", chronicConditions: JSON.stringify([]),            allergies: JSON.stringify([]),            schoolId: 1 },
    { studentCode: "STU019", name: "Sebastian Anderson",grade:"1", classroom: "1B", dateOfBirth: "2017-07-14", parentEmail: "sebastian.parent@demo.school",parentPhone: "555-0119", chronicConditions: JSON.stringify([]),            allergies: JSON.stringify([]),            schoolId: 1 },
    { studentCode: "STU020", name: "Lily Thomas",      grade: "1", classroom: "1B", dateOfBirth: "2017-01-30", parentEmail: "lily.parent@demo.school",     parentPhone: "555-0120", chronicConditions: JSON.stringify([]),            allergies: JSON.stringify([]),            schoolId: 1 },
    // Class K1
    { studentCode: "STU021", name: "Harper Jackson",   grade: "K", classroom: "K1", dateOfBirth: "2018-01-09", parentEmail: "harper.parent@demo.school",   parentPhone: "555-0121", chronicConditions: JSON.stringify([]),            allergies: JSON.stringify([]),            schoolId: 1 },
    { studentCode: "STU022", name: "Owen White",       grade: "K", classroom: "K1", dateOfBirth: "2018-04-17", parentEmail: "owen.parent@demo.school",     parentPhone: "555-0122", chronicConditions: JSON.stringify([]),            allergies: JSON.stringify([]),            schoolId: 1 },
    // Class 6A — new high-risk
    { studentCode: "STU023", name: "Dylan Harris",     grade: "6", classroom: "6A", dateOfBirth: "2012-05-05", parentEmail: "dylan.parent@demo.school",    parentPhone: "555-0123", chronicConditions: JSON.stringify([]),            allergies: JSON.stringify([]),            schoolId: 1 },
    { studentCode: "STU024", name: "Chloe Martin",     grade: "6", classroom: "6A", dateOfBirth: "2012-09-21", parentEmail: "chloe.parent@demo.school",    parentPhone: "555-0124", chronicConditions: JSON.stringify([]),            allergies: JSON.stringify([]),            schoolId: 1 },
    { studentCode: "STU025", name: "Ryan Thompson",    grade: "6", classroom: "6A", dateOfBirth: "2012-11-13", parentEmail: "ryan.parent@demo.school",     parentPhone: "555-0125", chronicConditions: JSON.stringify([]),            allergies: JSON.stringify([]),            schoolId: 1 },
    { studentCode: "STU026", name: "Nora Lewis",       grade: "6", classroom: "6A", dateOfBirth: "2012-03-08", parentEmail: "nora.parent@demo.school",     parentPhone: "555-0126", chronicConditions: JSON.stringify([]),            allergies: JSON.stringify([]),            schoolId: 1 },
    { studentCode: "STU027", name: "Jack Robinson",    grade: "6", classroom: "6A", dateOfBirth: "2012-07-25", parentEmail: "jack.parent@demo.school",     parentPhone: "555-0127", chronicConditions: JSON.stringify([]),            allergies: JSON.stringify([]),            schoolId: 1 },
    // Class 2A
    { studentCode: "STU028", name: "Ella Moore",       grade: "2", classroom: "2A", dateOfBirth: "2016-10-12", parentEmail: "ella.parent@demo.school",     parentPhone: "555-0128", chronicConditions: JSON.stringify([]),            allergies: JSON.stringify([]),            schoolId: 1 },
    { studentCode: "STU029", name: "Wyatt Clark",      grade: "2", classroom: "2A", dateOfBirth: "2016-12-04", parentEmail: "wyatt.parent@demo.school",    parentPhone: "555-0129", chronicConditions: JSON.stringify([]),            allergies: JSON.stringify([]),            schoolId: 1 },
    // Class 4B
    { studentCode: "STU030", name: "Penelope Young",   grade: "4", classroom: "4B", dateOfBirth: "2014-02-18", parentEmail: "penelope.parent@demo.school", parentPhone: "555-0130", chronicConditions: JSON.stringify([]),            allergies: JSON.stringify([]),            schoolId: 1 },
    { studentCode: "STU031", name: "Samuel King",      grade: "4", classroom: "4B", dateOfBirth: "2014-06-30", parentEmail: "samuel.parent@demo.school",   parentPhone: "555-0131", chronicConditions: JSON.stringify([]),            allergies: JSON.stringify([]),            schoolId: 1 },
  ]).returning();

  console.log("Created students");

  const allUsers = await db.select().from(usersTable);
  const nurseId = allUsers.find(u => u.role === "nurse")!.id;

  const idx = (code: string) => students.findIndex(s => s.studentCode === code);

  await db.insert(visitsTable).values([
    // ---- 5B flu cluster (days 0-5) ----
    { studentId: students[idx("STU001")].id, grade:"5", classroom:"5B", symptoms: JSON.stringify(["fever","headache","nausea"]),        temperature: 101.2, notes: "Student sent home with flu-like symptoms.",          actionTaken: "sent_home",         loggedById: nurseId, visitDate: daysAgo(0, 0) },
    { studentId: students[idx("STU002")].id, grade:"5", classroom:"5B", symptoms: JSON.stringify(["fever","sore_throat","cough"]),      temperature: 100.8, notes: "Similar symptoms to other 5B students.",             actionTaken: "sent_home",         loggedById: nurseId, visitDate: daysAgo(1, 1) },
    { studentId: students[idx("STU003")].id, grade:"5", classroom:"5B", symptoms: JSON.stringify(["fever","headache","fatigue"]),       temperature: 102.1, notes: "High fever, parent called.",                         actionTaken: "called_parent",     loggedById: nurseId, visitDate: daysAgo(2, 2) },
    { studentId: students[idx("STU004")].id, grade:"5", classroom:"5B", symptoms: JSON.stringify(["nausea","stomach_pain","headache"]), temperature:  99.5, notes: "Mild symptoms, rested in office.",                   actionTaken: "returned_to_class", loggedById: nurseId, visitDate: daysAgo(3, 0) },
    { studentId: students[idx("STU005")].id, grade:"5", classroom:"5B", symptoms: JSON.stringify(["fever","cough","sore_throat"]),      temperature: 101.5, notes: "Coughing frequently, sent home.",                    actionTaken: "sent_home",         loggedById: nurseId, visitDate: daysAgo(3, 3) },
    { studentId: students[idx("STU006")].id, grade:"5", classroom:"5B", symptoms: JSON.stringify(["fever","body_aches","chills"]),      temperature: 101.9, notes: "Body aches and chills — possible influenza.",         actionTaken: "sent_home",         loggedById: nurseId, visitDate: daysAgo(4, 1) },
    { studentId: students[idx("STU001")].id, grade:"5", classroom:"5B", symptoms: JSON.stringify(["fever","headache"]),                 temperature: 100.3, notes: "Follow-up visit — still symptomatic.",                actionTaken: "called_parent",     loggedById: nurseId, visitDate: daysAgo(5, 2) },

    // ---- 6A high-risk new cluster (days 0-4) ----
    { studentId: students[idx("STU023")].id, grade:"6", classroom:"6A", symptoms: JSON.stringify(["fever","headache","rash"]),          temperature: 101.0, notes: "Fever with rash — referred to doctor.",               actionTaken: "referred_to_doctor",loggedById: nurseId, visitDate: daysAgo(0, 1) },
    { studentId: students[idx("STU024")].id, grade:"6", classroom:"6A", symptoms: JSON.stringify(["fever","rash","fatigue"]),           temperature: 100.5, notes: "Spreading rash on arms, isolated.",                   actionTaken: "sent_home",         loggedById: nurseId, visitDate: daysAgo(1, 0) },
    { studentId: students[idx("STU025")].id, grade:"6", classroom:"6A", symptoms: JSON.stringify(["fever","headache","sore_throat"]),   temperature: 102.3, notes: "High fever, parents notified.",                      actionTaken: "called_parent",     loggedById: nurseId, visitDate: daysAgo(2, 3) },
    { studentId: students[idx("STU026")].id, grade:"6", classroom:"6A", symptoms: JSON.stringify(["fever","cough","body_aches"]),       temperature: 101.7, notes: "Chills and cough, sent home early.",                 actionTaken: "sent_home",         loggedById: nurseId, visitDate: daysAgo(3, 1) },
    { studentId: students[idx("STU027")].id, grade:"6", classroom:"6A", symptoms: JSON.stringify(["headache","fatigue","sore_throat"]), temperature:  99.8, notes: "Feeling generally unwell.",                          actionTaken: "monitored",         loggedById: nurseId, visitDate: daysAgo(4, 2) },
    { studentId: students[idx("STU023")].id, grade:"6", classroom:"6A", symptoms: JSON.stringify(["fever","rash"]),                    temperature: 100.9, notes: "Follow-up — rash spreading. Possible scarlet fever.", actionTaken: "referred_to_doctor",loggedById: nurseId, visitDate: daysAgo(4, 4) },

    // ---- 3A stomach virus (days 3-7) ----
    { studentId: students[idx("STU007")].id, grade:"3", classroom:"3A", symptoms: JSON.stringify(["stomach_pain","nausea"]),            temperature:  98.9, notes: "Upset stomach, monitored.",                          actionTaken: "monitored",         loggedById: nurseId, visitDate: daysAgo(3, 0) },
    { studentId: students[idx("STU008")].id, grade:"3", classroom:"3A", symptoms: JSON.stringify(["headache","stomach_pain"]),          temperature:  null, notes: "Mild headache, returned to class.",                  actionTaken: "returned_to_class", loggedById: nurseId, visitDate: daysAgo(4, 2) },
    { studentId: students[idx("STU009")].id, grade:"3", classroom:"3A", symptoms: JSON.stringify(["stomach_pain","nausea","fatigue"]),  temperature:  99.1, notes: "Possible stomach virus, sent home.",                 actionTaken: "sent_home",         loggedById: nurseId, visitDate: daysAgo(5, 1) },
    { studentId: students[idx("STU010")].id, grade:"3", classroom:"3A", symptoms: JSON.stringify(["vomiting","stomach_pain"]),          temperature:  99.4, notes: "Vomited in class, parents called.",                  actionTaken: "called_parent",     loggedById: nurseId, visitDate: daysAgo(6, 3) },
    { studentId: students[idx("STU007")].id, grade:"3", classroom:"3A", symptoms: JSON.stringify(["nausea","vomiting"]),                temperature:  null, notes: "Recurring nausea, kept in office.",                  actionTaken: "monitored",         loggedById: nurseId, visitDate: daysAgo(7, 0) },

    // ---- 2C respiratory (days 4-9) ----
    { studentId: students[idx("STU011")].id, grade:"2", classroom:"2C", symptoms: JSON.stringify(["rash","itching"]),                  temperature:  98.6, notes: "Possible allergic reaction, parent notified.",       actionTaken: "called_parent",     loggedById: nurseId, visitDate: daysAgo(4, 0) },
    { studentId: students[idx("STU012")].id, grade:"2", classroom:"2C", symptoms: JSON.stringify(["cough","runny_nose"]),               temperature:  null, notes: "Cold symptoms, returned to class.",                  actionTaken: "returned_to_class", loggedById: nurseId, visitDate: daysAgo(5, 2) },
    { studentId: students[idx("STU013")].id, grade:"2", classroom:"2C", symptoms: JSON.stringify(["cough","sore_throat","fever"]),      temperature: 100.1, notes: "Cough with low fever, monitored.",                   actionTaken: "monitored",         loggedById: nurseId, visitDate: daysAgo(6, 1) },

    // ---- 4D mixed symptoms ----
    { studentId: students[idx("STU014")].id, grade:"4", classroom:"4D", symptoms: JSON.stringify(["headache","fatigue"]),              temperature:  98.8, notes: "Complained of tiredness.",                           actionTaken: "monitored",         loggedById: nurseId, visitDate: daysAgo(1, 0) },
    { studentId: students[idx("STU015")].id, grade:"4", classroom:"4D", symptoms: JSON.stringify(["cough","sore_throat"]),             temperature:  99.2, notes: "Early cold symptoms.",                               actionTaken: "returned_to_class", loggedById: nurseId, visitDate: daysAgo(2, 2) },
    { studentId: students[idx("STU016")].id, grade:"4", classroom:"4D", symptoms: JSON.stringify(["fever","headache"]),                temperature: 100.4, notes: "Developed fever after lunch.",                       actionTaken: "sent_home",         loggedById: nurseId, visitDate: daysAgo(4, 3) },
    { studentId: students[idx("STU017")].id, grade:"4", classroom:"4D", symptoms: JSON.stringify(["fatigue","dizziness"]),             temperature:  99.0, notes: "Dizzy, rested — cleared to return.",                 actionTaken: "returned_to_class", loggedById: nurseId, visitDate: daysAgo(5, 0) },

    // ---- 1B ----
    { studentId: students[idx("STU018")].id, grade:"1", classroom:"1B", symptoms: JSON.stringify(["fever"]),                           temperature: 101.0, notes: "Fever developed during morning break.",              actionTaken: "sent_home",         loggedById: nurseId, visitDate: daysAgo(0, 0) },
    { studentId: students[idx("STU019")].id, grade:"1", classroom:"1B", symptoms: JSON.stringify(["stomach_pain"]),                    temperature:  null, notes: "Stomach ache before lunch.",                        actionTaken: "monitored",         loggedById: nurseId, visitDate: daysAgo(1, 1) },
    { studentId: students[idx("STU020")].id, grade:"1", classroom:"1B", symptoms: JSON.stringify(["cough","runny_nose"]),               temperature:  null, notes: "Cold-like symptoms.",                               actionTaken: "returned_to_class", loggedById: nurseId, visitDate: daysAgo(3, 2) },

    // ---- K1 ----
    { studentId: students[idx("STU021")].id, grade:"K", classroom:"K1", symptoms: JSON.stringify(["rash","fever"]),                    temperature:  99.8, notes: "Possible viral rash, parents notified.",             actionTaken: "called_parent",     loggedById: nurseId, visitDate: daysAgo(2, 0) },
    { studentId: students[idx("STU022")].id, grade:"K", classroom:"K1", symptoms: JSON.stringify(["vomiting"]),                        temperature:  null, notes: "Vomited after lunch, sent home.",                    actionTaken: "sent_home",         loggedById: nurseId, visitDate: daysAgo(3, 1) },

    // ---- 2A mild ----
    { studentId: students[idx("STU028")].id, grade:"2", classroom:"2A", symptoms: JSON.stringify(["headache"]),                        temperature:  null, notes: "Mild headache, returned after rest.",                actionTaken: "returned_to_class", loggedById: nurseId, visitDate: daysAgo(6, 0) },
    { studentId: students[idx("STU029")].id, grade:"2", classroom:"2A", symptoms: JSON.stringify(["cough"]),                           temperature:  null, notes: "Mild cough, no fever.",                             actionTaken: "returned_to_class", loggedById: nurseId, visitDate: daysAgo(7, 1) },

    // ---- 4B mild ----
    { studentId: students[idx("STU030")].id, grade:"4", classroom:"4B", symptoms: JSON.stringify(["fatigue","headache"]),              temperature:  98.5, notes: "Felt unwell, rested and returned.",                  actionTaken: "returned_to_class", loggedById: nurseId, visitDate: daysAgo(8, 0) },
    { studentId: students[idx("STU031")].id, grade:"4", classroom:"4B", symptoms: JSON.stringify(["sore_throat"]),                     temperature:  null, notes: "Mild sore throat.",                                 actionTaken: "returned_to_class", loggedById: nurseId, visitDate: daysAgo(9, 2) },
  ]);

  console.log("Created visits");

  const [alert1, alert2, alert3, alert4] = await db.insert(alertsTable).values([
    {
      type: "possible_outbreak",
      severity: "high",
      status: "active",
      title: "Possible Flu Outbreak — Class 5B",
      description: "7 students from classroom 5B reported fever, headache, and respiratory symptoms within the last 7 days. Pattern strongly suggests influenza. Immediate isolation and parent notification recommended.",
      affectedClassroom: "5B",
      affectedGrade: "5",
      affectedCount: 7,
      symptoms: JSON.stringify(["fever","headache","cough","sore_throat","nausea","body_aches"]),
      schoolId: 1,
    },
    {
      type: "possible_outbreak",
      severity: "high",
      status: "active",
      title: "Possible Viral Rash Outbreak — Class 6A",
      description: "6 students from classroom 6A reported fever and rash symptoms over the past 5 days. Pattern may indicate scarlet fever or viral exanthem. Medical review recommended immediately.",
      affectedClassroom: "6A",
      affectedGrade: "6",
      affectedCount: 6,
      symptoms: JSON.stringify(["fever","rash","headache","fatigue","sore_throat"]),
      schoolId: 1,
    },
    {
      type: "cluster_detected",
      severity: "medium",
      status: "active",
      title: "Stomach Virus Cluster — Class 3A",
      description: "5 students from classroom 3A reported gastrointestinal symptoms (stomach pain, nausea, vomiting) in the past 7 days. Possible norovirus. Monitor cafeteria hygiene.",
      affectedClassroom: "3A",
      affectedGrade: "3",
      affectedCount: 5,
      symptoms: JSON.stringify(["stomach_pain","nausea","vomiting","fatigue"]),
      schoolId: 1,
    },
    {
      type: "elevated_symptoms",
      severity: "low",
      status: "resolved",
      title: "Respiratory Symptoms — Class 2C",
      description: "3 students from classroom 2C reported respiratory symptoms. Situation monitored and resolved — unrelated cold viruses.",
      affectedClassroom: "2C",
      affectedGrade: "2",
      affectedCount: 3,
      symptoms: JSON.stringify(["cough","runny_nose","sore_throat"]),
      schoolId: 1,
      resolvedAt: daysAgo(1),
      resolvedBy: "Principal Martinez",
      resolutionNote: "Symptoms were mild and unrelated. Students recovered fully.",
    },
  ]).returning();

  console.log("Created alerts");

  const parent = allUsers.find(u => u.role === "parent");
  if (parent) {
    await db.insert(notificationsTable).values([
      {
        userId: parent.id,
        title: "Outbreak Alert: Class 5B Flu",
        message: "A flu outbreak has been detected in Class 5B. 7 students have reported fever and respiratory symptoms. Please monitor your child for symptoms and keep them home if unwell.",
        type: "outbreak_notice",
        isRead: false,
        alertId: alert1.id,
      },
      {
        userId: parent.id,
        title: "Urgent: Possible Rash Outbreak in Class 6A",
        message: "Students in Class 6A have been reporting fever and rash. This may indicate scarlet fever. Please check your child for any rash and contact the school nurse immediately.",
        type: "outbreak_notice",
        isRead: false,
        alertId: alert2.id,
      },
      {
        userId: parent.id,
        title: "Exposure Notice: Stomach Virus in Class 3A",
        message: "Students in Class 3A may have been exposed to a stomach virus. Watch for nausea, stomach pain, or vomiting over the next 48 hours. Keep your child hydrated.",
        type: "exposure_alert",
        isRead: false,
        alertId: alert3.id,
      },
      {
        userId: parent.id,
        title: "Cluster Warning Resolved — Class 2C",
        message: "The respiratory symptom cluster in Class 2C has been resolved. All students have recovered. No further action needed.",
        type: "cluster_warning",
        isRead: true,
        alertId: alert4.id,
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
