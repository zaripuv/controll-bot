import { Request, Response } from "express";
import { asyncHandler } from "../../shared/asyncHandler";
import {
  createSubmission,
  reviewSubmission,
  getMySubmissions,
  getAllSubmissions,
  updateSmsCode,
} from "./submission.service";

export const create = asyncHandler(async (req: any, res: Response) => {
  const userId = req.user.id;
  const { phone, smsCode } = req.body;

  const submission = await createSubmission(userId, phone, smsCode);

  res.status(201).json(submission);
});

export const updateSms = asyncHandler(async (req: any, res: Response) => {
  const submissionId = Number(req.params.id);
  const userId = req.user.id;
  const { smsCode } = req.body;

  const updated = await updateSmsCode(submissionId, userId, smsCode);

  res.json(updated);
});

export const review = asyncHandler(async (req: any, res: Response) => {
  const submissionId = Number(req.params.id);
  const operatorId = req.user.id;
  const { status } = req.body;

  const result = await reviewSubmission(submissionId, operatorId, status);

  res.json(result);
});

export const mySubmissions = asyncHandler(async (req: any, res: Response) => {
  const userId = req.user.id;
  const submissions = await getMySubmissions(userId);
  res.json(submissions);
});

export const list = asyncHandler(async (req: any, res: Response) => {
  const { status } = req.query;
  const submissions = await getAllSubmissions(status as string);
  res.json(submissions);
});