import express from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { roleMiddleware } from "../../middlewares/role.middleware";
import prisma from "../../config/database";
import bcrypt from "bcrypt";

const router = express.Router();

/* Operator yaratish */
router.post(
  "/create-operator",
  authMiddleware,
  roleMiddleware("SUPER_ADMIN"),
  async (req: any, res) => {
    const { username, password, role } = req.body;

    if (!["VOTE_OPERATOR", "PAYMENT_OPERATOR"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashed,
        role,
      },
    });

    res.json(user);
  }
);

/* Operator o‘chirish */
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("SUPER_ADMIN"),
  async (req, res) => {
    const id = Number(req.params.id);

    await prisma.user.delete({
      where: { id },
    });

    res.json({ message: "Operator deleted" });
  }
);

/* O‘z profilini olish */
router.get(
  "/me",
  authMiddleware,
  async (req: any, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        role: true,
        balance: true,
      },
    });

    res.json(user);
  }
);

export default router;