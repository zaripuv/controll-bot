import express from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { roleMiddleware } from "../../middlewares/role.middleware";
import {
  create,
  approve,
  myWithdrawals,
  list,
  cancel,
  lock
} from "./withdrawal.controller";

import { validate } from "../../middlewares/validate.middleware";
import { createWithdrawalSchema } from "../../validators/withdrawal.schema";
import { criticalRateLimit } from "../../middlewares/rateLimit.middleware";

const router = express.Router();

// USER create
router.post(
  "/",
  authMiddleware,
  criticalRateLimit,
  roleMiddleware("USER"),
  validate(createWithdrawalSchema),
  create
);

// USER own withdrawals
router.get(
  "/my",
  authMiddleware,
  roleMiddleware("USER"),
  myWithdrawals
);

// USER cancel
router.patch(
  "/:id/cancel",
  authMiddleware,
  roleMiddleware("USER"),
  cancel
);

// PAYMENT_OPERATOR list
router.get(
  "/",
  authMiddleware,
  roleMiddleware("PAYMENT_OPERATOR"),
  list
);

// PAYMENT_OPERATOR approve
router.patch(
  "/:id/approve",
  authMiddleware,
  roleMiddleware("PAYMENT_OPERATOR"),
  approve
);

router.patch(
  "/:id/lock",
  authMiddleware,
  roleMiddleware("PAYMENT_OPERATOR"),
  lock
);

export default router;