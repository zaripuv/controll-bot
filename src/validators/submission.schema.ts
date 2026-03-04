import { z } from "zod";

export const createSubmissionSchema = z.object({
  body: z.object({

    phone: z
      .string()
      .min(9, "Invalid phone number")
      .max(20, "Invalid phone number"),

    smsCode: z
      .string()
      .min(3)
      .max(10)
      .optional(),

  }),
});