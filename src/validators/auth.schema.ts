import { z } from "zod";

export const loginSchema = z.object({
  body: z.object({
    username: z.string().min(4),
    password: z.string().min(6),
  }),
});