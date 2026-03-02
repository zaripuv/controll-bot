import { Router } from "express";
import {
  create,
  review,
  mySubmissions,
  list
} from "./submission.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { roleMiddleware } from "../../middlewares/role.middleware";

const router = Router();

// USER create
router.post(
  "/",
  authMiddleware,
  roleMiddleware("USER"),
  create
);

// USER own list
router.get(
  "/my",
  authMiddleware,
  roleMiddleware("USER"),
  mySubmissions
);

// OPERATOR list
router.get(
  "/",
  authMiddleware,
  roleMiddleware("VOTE_OPERATOR"),
  list
);

// OPERATOR review (approve/reject)
router.patch(
  "/:id/review",
  authMiddleware,
  roleMiddleware("VOTE_OPERATOR"),
  review
);

export default router;