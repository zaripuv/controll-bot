import express from "express";
import cors from "cors";
import prisma from "./config/database";
import bcrypt from "bcrypt";
import authRoutes from "./modules/auth/auth.routes";
import { authMiddleware } from "./middlewares/auth.middleware";
import { roleMiddleware } from "./middlewares/role.middleware";
import { errorMiddleware } from "./middlewares/error.middleware";
import submissionRoutes from "./modules/submission/submission.routes";
import withdrawalRoutes from "./modules/withdrawal/withdrawal.routes";
import projectRoutes from "./modules/project/project.routes";
import userRoutes from "./modules/user/user.routes";
import statsRoutes from "./modules/stats/stats.routes";
import { globalRateLimit } from "./middlewares/rateLimit.middleware";
import { httpLogger } from "./middlewares/logger.middleware";

const app = express();

app.use(cors());
app.use(express.json());
app.use(httpLogger);

/* ROUTES */
app.use(authRoutes);
app.use(globalRateLimit);
app.use("/users", userRoutes);
app.use("/submission", submissionRoutes);
app.use("/withdrawal", withdrawalRoutes);
app.use("/stats", statsRoutes);
app.use("/projects", projectRoutes);

/* HEALTH */
app.get("/health", (_, res) => {
  res.json({ status: "OK" });
});

/* USERS (keyinchalik alohida modulga o'tadi) */
app.get("/users", async (_, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/* SUPER ADMIN CREATION */
app.post("/create-super-admin", async (_, res) => {
  try {
    const existing = await prisma.user.findFirst({
      where: { role: "SUPER_ADMIN" },
    });

    if (existing) {
      return res.status(400).json({ message: "Super admin already exists" });
    }

    const hashedPassword = await bcrypt.hash("123456", 10);

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
        username: "superadmin",
        password: hashedPassword,
        role: "SUPER_ADMIN",
        referralCode: generateReferralCode(),
      },
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/profile", authMiddleware, async (req: any, res) => {
  res.json({
    message: "Protected route ishladi",
    user: req.user,
  });
});

app.get(
  "/admin/stats",
  authMiddleware,
  roleMiddleware("SUPER_ADMIN"),
  (req, res) => {
    res.json({
      message: "Admin only route",
      secretStats: "Only SUPER_ADMIN can see this",
    });
  },
);

app.use(errorMiddleware);

export default app;
