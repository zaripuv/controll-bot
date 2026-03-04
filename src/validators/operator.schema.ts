import { z } from "zod";

export const createOperatorSchema = z.object({
  body: z.object({

    username: z
      .string()
      .min(4, "Username must be at least 4 characters"),

    password: z
      .string()
      .min(6, "Password must be at least 6 characters"),

    role: z.enum(["VOTE_OPERATOR", "PAYMENT_OPERATOR"])

  })
});