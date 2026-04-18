import pg from "pg";
const { Pool } = pg;

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL must be set");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function clear() {
  await pool.query("TRUNCATE notifications, visits, alerts, students, users RESTART IDENTITY CASCADE");
  console.log("All data cleared.");
  await pool.end();
}

clear().catch(e => { console.error(e.message); process.exit(1); });
