import rateLimit from "express-rate-limit";

/* GLOBAL LIMIT */
export const globalRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minut
  max: 100, // 100 request / minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later",
  },
});

/* AUTH LIMIT (LOGIN) */
export const authRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 5, // 5 login / minute
  message: {
    success: false,
    message: "Too many login attempts, please try again later",
  },
});

/* CRITICAL API LIMIT */
export const criticalRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: "Too many requests for this action",
  },
});