import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { roleMiddleware } from "../../middlewares/role.middleware";
import {
  globalStats,
  voteOperatorStats,
  paymentOperatorStats
} from "./stats.controller";

const router = Router();

router.get(
  "/global",
  authMiddleware,
  roleMiddleware("SUPER_ADMIN"),
  globalStats
);

router.get(
  "/vote-operators",
  authMiddleware,
  roleMiddleware("SUPER_ADMIN"),
  voteOperatorStats
);

router.get(
  "/payment-operators",
  authMiddleware,
  roleMiddleware("SUPER_ADMIN"),
  paymentOperatorStats
);

export default router;