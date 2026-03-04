import { Response } from "express";
import { asyncHandler } from "../../shared/asyncHandler";
import {
  getReferralLink,
  getReferralStats,
  topReferrers,
} from "./user.service";
import type { Request } from "express";

export const referralLink = asyncHandler(async (req: any, res: Response) => {
  const data = await getReferralLink(req.user.id);

  res.json(data);
});

export const referralStats = asyncHandler(async (req: any, res: Response) => {
  const data = await getReferralStats(req.user.id);

  res.json(data);
});

interface ReferralLeaderboardRequest extends Request {
  user: {
    id: string;
  };
}

export const referralLeaderboard = asyncHandler(
  async (_req: Request, res: Response) => {
    const data = await topReferrers();

    res.json(data);
  },
);
