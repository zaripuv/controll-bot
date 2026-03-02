import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";

export const roleMiddleware = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;

    if (!userRole) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: "You do not have permission" });
    }

    next();
  };
};