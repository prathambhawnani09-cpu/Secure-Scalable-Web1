import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";
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

const tokenStore = new Map<string, number>();

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
