// src/routes/auth.ts
import { Router } from "express";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import { authMiddleware, generateToken, AuthRequest } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

router.post("/login", async (req, res) => {
  try {
    console.log("Login attempt payload:", req.body);
    const { identifier, email, password } = req.body;
    const id = identifier ?? email;

    if (!id || !password)
      return res
        .status(400)
        .json({ success: false, message: "Email/Phone and password required" });

    const lookup = id.toLowerCase ? id.toLowerCase().trim() : id;
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: lookup },
          { phone: id.trim() },
        ],
      },
    });

    if (!user || !(await bcrypt.compare(password, user.password)))
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });

    const token = generateToken(user.id);
    const { password: _, ...userData } = user;
    res.json({ success: true, data: { token, user: userData } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Login failed" });
  }
});

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashed },
    });
    const token = generateToken(user.id);
    const { password: _, ...userData } = user;
    res.json({ success: true, data: { token, user: userData } });
  } catch (err: any) {
    if (err.code === "P2002")
      return res
        .status(400)
        .json({ success: false, message: "Email already exists" });
    res.status(500).json({ success: false, message: "Registration failed" });
  }
});

router.post("/forgot-password", async (req, res) => {
  res.json({ success: true, message: "Reset link sent if email exists" });
});

router.get("/profile", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
    res.json({ success: true, data: user });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch profile" });
  }
});

router.put("/profile", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { name } = req.body;
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { name },
      select: { id: true, name: true, email: true, role: true },
    });
    res.json({ success: true, data: user });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Failed to update profile" });
  }
});

export { router as authRoutes };
