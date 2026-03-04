import { Router } from "express";
import { login, refresh, telegramAuth, logout } from "./auth.controller";
import { validate } from "../../middlewares/validate.middleware";
import { loginSchema } from "../../validators/auth.schema";
import { authRateLimit } from "../../middlewares/rateLimit.middleware";

const router = Router();

router.post(
  "/login",
  authRateLimit,
  validate(loginSchema),
  login
);

router.post("/refresh", refresh);

router.post("/auth/telegram", telegramAuth);

router.post("/logout", logout);

export default router;
