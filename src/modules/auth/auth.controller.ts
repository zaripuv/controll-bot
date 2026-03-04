import { Request, Response } from "express";
import {
  loginUser,
  refreshAccessToken,
  telegramLogin,
  logoutUser,
} from "./auth.service";
import { asyncHandler } from "../../shared/asyncHandler";

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { username, password } = req.body;

  const tokens = await loginUser(username, password);

  res.json(tokens);
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  const tokens = await refreshAccessToken(refreshToken);

  res.json(tokens);
});

export const telegramAuth = asyncHandler(
  async (req: Request, res: Response) => {
    const { telegramId, referralCode } = req.body;

    if (!telegramId) {
      return res.status(400).json({ message: "telegramId required" });
    }

    const tokens = await telegramLogin(telegramId, referralCode);

    res.json(tokens);
  },
);

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  const result = await logoutUser(refreshToken);

  res.json(result);
});
