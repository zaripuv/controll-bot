import { Router } from "express";
import { login, refresh, telegramAuth, logout } from "./auth.controller";

const router = Router();

router.post("/login", login);
router.post("/refresh", refresh);
router.post("/auth/telegram", telegramAuth);
router.post("/logout", logout);

export default router;