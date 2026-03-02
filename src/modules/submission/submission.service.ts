import prisma from "../../config/database";
import { SubmissionStatus } from "@prisma/client";

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
  smsCode: string,
) => {
  if (!phone || !smsCode) {
    throw new Error("Phone and SMS code are required");
  }

  if (smsCode.length < 3 || smsCode.length > 10) {
    throw new Error("Invalid SMS code format");
  }

  const submission = await prisma.submission.create({
    data: {
      userId,
      phone,
      smsCode,
      status: "PENDING",
    },
  });

  expireSubmissionAfterDelay(submission.id);

  return submission;
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
      include: {
        user: true,
      },
    });

    if (!submission) {
      throw new Error("Submission not found");
    }

    if (submission.status !== "PENDING") {
      throw new Error("Submission already processed");
    }

    await tx.submission.update({
      where: { id: submissionId },
      data: {
        status,
        reviewedBy: operatorId,
        reviewedAt: new Date(),
      },
    });

    if (status === "APPROVED") {
      const reward = await getRewardAmount(tx);

      await tx.user.update({
        where: { id: submission.userId },
        data: {
          balance: {
            increment: reward,
          },
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
  }, 60000); // 60 seconds
};
