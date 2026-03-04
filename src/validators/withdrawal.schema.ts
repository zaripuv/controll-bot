import { z } from "zod";

export const createWithdrawalSchema = z.object({
  body: z.object({

    cardNumber: z
      .string()
      .min(12, "Card number too short")
      .max(20, "Card number too long"),

    amount: z
      .coerce
      .number()
      .positive("Amount must be greater than 0")

  }),
});