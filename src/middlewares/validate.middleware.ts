import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { AppError } from "../shared/appError";

export const validate =
  (schema: ZodSchema) =>
  (req: Request, _res: Response, next: NextFunction) => {

    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {

      const message = result.error.issues
        .map((e) => e.message)
        .join(", ");

      throw new AppError(message, 400);
    }

    next();
  };