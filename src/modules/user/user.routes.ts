import express from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { roleMiddleware } from "../../middlewares/role.middleware";
import prisma from "../../config/database";
import bcrypt from "bcrypt";
import { AppError } from "../../shared/appError";

import { validate } from "../../middlewares/validate.middleware";
import { createOperatorSchema } from "../../validators/operator.schema";
import { referralLink } from "./user.controller";

const router = express.Router();

/* Operator yaratish */
router.post(
  "/create-operator",
  authMiddleware,
  roleMiddleware("SUPER_ADMIN"),
  validate(createOperatorSchema),
  async (req: any, res) => {
    const { username, password, role } = req.body;

    if (!username || username.length < 4) {
      throw new AppError("Username must be at least 4 characters", 400);
    }

    if (!password || password.length < 6) {
      throw new AppError("Password must be at least 6 characters", 400);
    }

    if (!["VOTE_OPERATOR", "PAYMENT_OPERATOR"].includes(role)) {
      throw new AppError("Invalid role", 400);
    }

    const existing = await prisma.user.findUnique({
      where: { username },
    });

    if (existing) {
      throw new AppError("Username already exists", 409);
    }

    const hashed = await bcrypt.hash(password, 10);

    const generateReferralCode = () => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

      let code = "";

      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      return code;
    };

    const user = await prisma.user.create({
      data: {
        username,
        password: hashed,
        role,
        referralCode: generateReferralCode(),
      },
    });

    res.json(user);
  },
);

/* Operator o‘chirish */
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("SUPER_ADMIN"),
  async (req, res) => {
    const id = Number(req.params.id);

    const existing = await prisma.user.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError("Operator not found", 404);
    }

    await prisma.user.delete({
      where: { id },
    });

    res.json({ message: "Operator deleted" });
  },
);

/* O‘z profilini olish */
router.get("/me", authMiddleware, async (req: any, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      username: true,
      role: true,
      balance: true,
    },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  res.json(user);
});

/* Operator list */
router.get(
  "/operators",
  authMiddleware,
  roleMiddleware("SUPER_ADMIN"),
  async (_req, res) => {
    const operators = await prisma.user.findMany({
      where: {
        role: {
          in: ["VOTE_OPERATOR", "PAYMENT_OPERATOR"],
        },
      },
      select: {
        id: true,
        username: true,
        role: true,
      },
    });

    res.json(operators);
  },
);

router.get("/referral", authMiddleware, referralLink);

export default router;
