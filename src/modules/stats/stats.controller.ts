import { Request, Response } from "express";
import { asyncHandler } from "../../shared/asyncHandler";
import {
  getGlobalStats,
  getVoteOperatorStats,
  getPaymentOperatorStats
} from "./stats.service";

export const globalStats = asyncHandler(
  async (_req: Request, res: Response) => {
    const stats = await getGlobalStats();
    res.json(stats);
  }
);

export const voteOperatorStats = asyncHandler(
  async (_req: Request, res: Response) => {
    const stats = await getVoteOperatorStats();
    res.json(stats);
  }
);

export const paymentOperatorStats = asyncHandler(
  async (_req: Request, res: Response) => {
    const stats = await getPaymentOperatorStats();
    res.json(stats);
  }
);