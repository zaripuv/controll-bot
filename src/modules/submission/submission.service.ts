import prisma from "../../config/database";
import { SubmissionStatus, Prisma } from "@prisma/client";
import { AppError } from "../../shared/appError";

export const createSubmission = async (
  userId: number,
  phone: string,
  smsCode?: string,
) => {
  if (!phone) {
    throw new AppError("Phone is required", 400);
  }

  if (smsCode && (smsCode.length < 3 || smsCode.length > 10)) {
    throw new AppError("Invalid SMS code format", 400);
  }

  const project = await prisma.project.findFirst({
    orderBy: { id: "desc" },
  });

  if (!project) {
    throw new AppError("No active project found", 500);
  }

  const submission = await prisma.submission.create({
    data: {
      userId,
      phone,
      projectId: project.id,
      ...(smsCode ? { smsCode } : {}),
      status: "PENDING",
    },
  });

  expireSubmissionAfterDelay(submission.id);

  return submission;
};

export const updateSmsCode = async (
  submissionId: number,
  userId: number,
  smsCode: string,
) => {
  if (!smsCode) {
    throw new AppError("SMS code required", 400);
  }

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
  });

  if (!submission) {
    throw new AppError("Submission not found", 404);
  }

  if (submission.userId !== userId) {
    throw new AppError("Forbidden", 403);
  }

  if (submission.status !== "PENDING") {
    throw new AppError("Submission already processed", 400);
  }

  return prisma.submission.update({
    where: { id: submissionId },
    data: { smsCode },
  });
};

export const reviewSubmission = async (
  submissionId: number,
  operatorId: number,
  status: SubmissionStatus,
) => {
  if (!["APPROVED", "REJECTED"].includes(status)) {
    throw new AppError("Invalid status", 400);
  }

  return prisma.$transaction(async (tx) => {
    const submission = await tx.submission.findUnique({
      where: { id: submissionId },
      include: {
        user: true,
        project: true,
      },
    });

    if (!submission) {
      throw new AppError("Submission not found", 404);
    }

    if (submission.status !== "PENDING") {
      throw new AppError("Submission already processed", 400);
    }

    if (submission.lockedBy && submission.lockedBy !== operatorId) {
      throw new AppError("Submission locked by another operator", 409);
    }

    await tx.submission.update({
      where: { id: submissionId },
      data: {
        lockedBy: operatorId,
        lockedAt: new Date(),
      },
    });

    setTimeout(async () => {
      const current = await prisma.submission.findUnique({
        where: { id: submissionId },
      });

      if (
        current &&
        current.status === "PENDING" &&
        current.lockedBy === operatorId
      ) {
        await prisma.submission.update({
          where: { id: submissionId },
          data: {
            lockedBy: null,
            lockedAt: null,
          },
        });
      }
    }, 30000);

    await tx.submission.update({
      where: { id: submissionId },
      data: {
        status,
        reviewedBy: operatorId,
        reviewedAt: new Date(),
        lockedBy: null,
        lockedAt: null,
      },
    });

    await tx.actionLog.create({
      data: {
        userId: operatorId,
        action:
          status === "APPROVED" ? "APPROVE_SUBMISSION" : "REJECT_SUBMISSION",
        entity: "SUBMISSION",
        entityId: submissionId,
        meta: JSON.stringify({
          targetUserId: submission.userId,
        }),
      },
    });

    if (status === "APPROVED") {
      const rewardDecimal = new Prisma.Decimal(submission.project.reward);

      await tx.user.update({
        where: { id: submission.userId },
        data: {
          balance: { increment: rewardDecimal },
        },
      });

      await tx.balanceHistory.create({
        data: {
          userId: submission.userId,
          amount: rewardDecimal,
          type: "REWARD",
          reference: `submission:${submissionId}`,
        },
      });

      if (submission.user.referredBy) {
        const referralReward = new Prisma.Decimal(2000); // referral bonus

        await tx.user.update({
          where: { id: submission.user.referredBy },
          data: {
            balance: { increment: referralReward },
          },
        });

        await tx.balanceHistory.create({
          data: {
            userId: submission.user.referredBy,
            amount: referralReward,
            type: "REFERRAL",
            reference: `referral:${submission.userId}`,
          },
        });
      }
    }

    return {
      message: `Submission ${status.toLowerCase()}`,
      telegramId: submission.user.telegramId
        ? submission.user.telegramId.toString()
        : null,
    };
  });
};

export const getMySubmissions = async (userId: number) => {
  return prisma.submission.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
};

export const getAllSubmissions = async (status?: string) => {
  return prisma.submission.findMany({
    where: status ? { status: status as any } : {},
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          phone: true,
        },
      },
    },
  });
};

const expireSubmissionAfterDelay = (submissionId: number) => {
  setTimeout(async () => {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
    });

    if (submission && submission.status === "PENDING") {
      await prisma.submission.update({
        where: { id: submissionId },
        data: { status: "EXPIRED" },
      });
    }
  }, 60000);
};
