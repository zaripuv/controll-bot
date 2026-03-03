import prisma from "../../config/database";
import { SubmissionStatus, Prisma } from "@prisma/client";

const getRewardAmount = async (tx: any) => {
  const config = await tx.systemConfig.findUnique({
    where: { key: "reward" },
  });

  if (!config) {
    throw new Error("Reward config not found");
  }

  return Number(config.value);
};

export const createSubmission = async (
  userId: number,
  phone: string,
  smsCode?: string,
) => {
  if (!phone) {
    throw new Error("Phone is required");
  }

  if (smsCode && (smsCode.length < 3 || smsCode.length > 10)) {
    throw new Error("Invalid SMS code format");
  }

  const submission = await prisma.submission.create({
    data: {
      userId,
      phone,
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
    throw new Error("SMS code required");
  }

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
  });

  if (!submission) throw new Error("Submission not found");
  if (submission.userId !== userId) throw new Error("Forbidden");
  if (submission.status !== "PENDING")
    throw new Error("Submission already processed");

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
    throw new Error("Invalid status");
  }

  return prisma.$transaction(async (tx) => {
    const submission = await tx.submission.findUnique({
      where: { id: submissionId },
      include: { user: true },
    });

    if (!submission) throw new Error("Submission not found");
    if (submission.status !== "PENDING")
      throw new Error("Submission already processed");

    if (submission.lockedBy && submission.lockedBy !== operatorId) {
      throw new Error("Submission locked by another operator");
    }

    await tx.submission.update({
      where: { id: submissionId },
      data: {
        lockedBy: operatorId,
        lockedAt: new Date(),
      },
    });

    // ACTION LOG
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
      const reward = await getRewardAmount(tx);
      const rewardDecimal = new Prisma.Decimal(reward);

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
