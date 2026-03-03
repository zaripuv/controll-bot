import { Response } from "express";
import { asyncHandler } from "../../shared/asyncHandler";
import {
  createWithdrawalService,
  approveWithdrawalService,
  getMyWithdrawals,
  getAllWithdrawals,
  cancelWithdrawalService,
  lockWithdrawalService,
} from "./withdrawal.service";

export const create = asyncHandler(async (req: any, res: Response) => {
  const userId = req.user.id;
  const { cardNumber, amount } = req.body;

  const withdrawal = await createWithdrawalService(
    userId,
    cardNumber,
    Number(amount)
  );

  res.status(201).json(withdrawal);
});

export const approve = asyncHandler(async (req: any, res: Response) => {
  const withdrawalId = Number(req.params.id);
  const operatorId = req.user.id;

  const result = await approveWithdrawalService(
    withdrawalId,
    operatorId
  );

  res.json(result);
});

export const myWithdrawals = asyncHandler(async (req: any, res: Response) => {
  const withdrawals = await getMyWithdrawals(req.user.id);
  res.json(withdrawals);
});

export const list = asyncHandler(async (req: any, res: Response) => {
  const { status } = req.query;
  const withdrawals = await getAllWithdrawals(status as any);
  res.json(withdrawals);
});

export const cancel = asyncHandler(async (req: any, res: Response) => {
  const withdrawalId = Number(req.params.id);
  const result = await cancelWithdrawalService(
    withdrawalId,
    req.user.id
  );

  res.json(result);
});

export const lock = asyncHandler(async (req: any, res: Response) => {
  const withdrawalId = Number(req.params.id);
  const operatorId = req.user.id;

  const result = await lockWithdrawalService(
    withdrawalId,
    operatorId
  );

  res.json(result);
});