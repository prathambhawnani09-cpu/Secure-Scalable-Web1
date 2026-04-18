import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import nodemailer from "nodemailer";
import {
  LoginBody,
} from "@workspace/api-zod";

const router = Router();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "schoolhealth_salt").digest("hex");
}

function generateToken(userId: number): string {
  return crypto.createHash("sha256").update(`${userId}-${Date.now()}-schoolhealth`).digest("hex");
}

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const tokenStore = new Map<string, number>();

interface PendingRegistration {
  otp: string;
  expiresAt: number;
  name: string;
  email: string;
  passwordHash: string;
  role: "nurse" | "admin" | "parent" | "student";
  phone?: string;
  schoolName?: string;
}

const pendingRegistrations = new Map<string, PendingRegistration>();

async function sendOtpEmail(email: string, otp: string, name: string): Promise<boolean> {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  console.log(`[OTP] Verification code for ${email}: ${otp}`);

  if (!host || !user || !pass) {
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: `"SymptomSense" <${user}>`,
      to: email,
      subject: "SymptomSense — Your verification code",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#fff;">
          <h2 style="color:#1d4ed8;margin-bottom:8px;">SymptomSense</h2>
          <p style="color:#374151;">Hi ${name},</p>
          <p style="color:#374151;">Your email verification code is:</p>
          <div style="background:#f3f4f6;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
            <span style="font-size:40px;font-weight:700;letter-spacing:12px;color:#1e293b;">${otp}</span>
          </div>
          <p style="color:#6b7280;font-size:14px;">This code expires in <strong>10 minutes</strong>. If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error("[OTP] Email send failed:", err);
    return false;
  }
}

router.post("/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: "Invalid request body" });
    return;
  }

  const { email, password } = parsed.data;
  const hash = hashPassword(password);

  const users = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  const user = users[0];

  if (!user || user.passwordHash !== hash) {
    res.status(401).json({ error: "unauthorized", message: "Invalid email or password" });
    return;
  }

  const token = generateToken(user.id);
  tokenStore.set(token, user.id);

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      schoolId: user.schoolId,
      createdAt: user.createdAt.toISOString(),
    },
    token,
  });
});

const ROLE_ACCESS_CODES: Record<string, string> = {
  admin: "admin222",
  nurse: "nurse222",
};

router.post("/register", async (req, res) => {
  const { name, email, password, role, phone, schoolName, accessCode } = req.body;

  if (!name || !email || !password || !role) {
    res.status(400).json({ error: "validation_error", message: "Name, email, password and role are required" });
    return;
  }

  if (!["nurse", "admin", "parent", "student"].includes(role)) {
    res.status(400).json({ error: "validation_error", message: "Role must be nurse, admin, parent, or student" });
    return;
  }

  if (ROLE_ACCESS_CODES[role]) {
    if (!accessCode || accessCode !== ROLE_ACCESS_CODES[role]) {
      res.status(403).json({ error: "forbidden", message: "Invalid access code for this role." });
      return;
    }
  }

  if (password.length < 8) {
    res.status(400).json({ error: "validation_error", message: "Password must be at least 8 characters" });
    return;
  }

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "conflict", message: "An account with this email already exists" });
    return;
  }

  const passwordHash = hashPassword(password);

  const [user] = await db.insert(usersTable).values({
    email,
    passwordHash,
    name,
    role,
    schoolId: 1,
  }).returning();

  const token = generateToken(user.id);
  tokenStore.set(token, user.id);

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      schoolId: user.schoolId,
      createdAt: user.createdAt.toISOString(),
    },
    token,
  });
});

router.post("/register/send-otp", async (req, res) => {
  const { name, email, password, role, phone, schoolName } = req.body;

  if (!name || !email || !password || !role) {
    res.status(400).json({ error: "validation_error", message: "Name, email, password and role are required" });
    return;
  }

  if (!["nurse", "admin", "parent", "student"].includes(role)) {
    res.status(400).json({ error: "validation_error", message: "Role must be nurse, admin, parent, or student" });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: "validation_error", message: "Password must be at least 8 characters" });
    return;
  }

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "conflict", message: "An account with this email already exists" });
    return;
  }

  const otp = generateOtp();
  const expiresAt = Date.now() + 10 * 60 * 1000;
  const passwordHash = hashPassword(password);

  pendingRegistrations.set(email, { otp, expiresAt, name, email, passwordHash, role, phone, schoolName });

  const emailSent = await sendOtpEmail(email, otp, name);

  res.json({
    success: true,
    emailSent,
    message: emailSent
      ? `Verification code sent to ${email}`
      : `Could not send verification email — please contact support.`,
  });
});

router.post("/register/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    res.status(400).json({ error: "validation_error", message: "Email and OTP are required" });
    return;
  }

  const pending = pendingRegistrations.get(email);
  if (!pending) {
    res.status(400).json({ error: "not_found", message: "No pending registration found. Please restart signup." });
    return;
  }

  if (Date.now() > pending.expiresAt) {
    pendingRegistrations.delete(email);
    res.status(400).json({ error: "expired", message: "Verification code expired. Please restart signup." });
    return;
  }

  if (pending.otp !== otp.trim()) {
    res.status(400).json({ error: "invalid_otp", message: "Incorrect code. Please try again." });
    return;
  }

  pendingRegistrations.delete(email);

  const [user] = await db.insert(usersTable).values({
    email: pending.email,
    passwordHash: pending.passwordHash,
    name: pending.name,
    role: pending.role,
    schoolId: 1,
  }).returning();

  const token = generateToken(user.id);
  tokenStore.set(token, user.id);

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      schoolId: user.schoolId,
      createdAt: user.createdAt.toISOString(),
    },
    token,
  });
});

router.get("/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "unauthorized", message: "No token provided" });
    return;
  }

  const token = authHeader.slice(7);
  const userId = tokenStore.get(token);

  if (!userId) {
    res.status(401).json({ error: "unauthorized", message: "Invalid token" });
    return;
  }

  const users = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  const user = users[0];

  if (!user) {
    res.status(401).json({ error: "unauthorized", message: "User not found" });
    return;
  }

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    schoolId: user.schoolId,
    createdAt: user.createdAt.toISOString(),
  });
});

router.post("/logout", (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    tokenStore.delete(authHeader.slice(7));
  }
  res.json({ success: true });
});

export { router as authRouter, tokenStore, hashPassword };
