import express from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { roleMiddleware } from "../../middlewares/role.middleware";
import {
  createProject,
  listProjects,
  projectStats,
  updateProject
} from "./project.controller";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  roleMiddleware("SUPER_ADMIN"),
  createProject
);

router.get(
  "/",
  authMiddleware,
  roleMiddleware("SUPER_ADMIN"),
  listProjects
);

router.get(
  "/:id/stats",
  authMiddleware,
  roleMiddleware("SUPER_ADMIN"),
  projectStats
);

router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware("SUPER_ADMIN"),
  updateProject
);

export default router;