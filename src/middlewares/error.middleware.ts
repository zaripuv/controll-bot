import { Request, Response, NextFunction } from "express";
import { AppError } from "../shared/appError";

export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  }

  console.error("UNEXPECTED ERROR:", err);

  return res.status(500).json({
    success: false,
    message: "Internal Server Error"
  });
};