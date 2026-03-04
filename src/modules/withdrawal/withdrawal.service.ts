import prisma from "../../config/database";
import { Prisma, WithdrawalStatus } from "@prisma/client";
import { AppError } from "../../shared/appError";

export const createWithdrawalService = async (
  userId: number,
  cardNumber: string,
  amount: number,
) => {
  if (!cardNumber || !amount) {
    throw new AppError("cardNumber and amount required", 400);
  }

  const withdrawalAmount = new Prisma.Decimal(amount);

  if (withdrawalAmount.lte(0)) {
    throw new AppError("Amount must be greater than 0", 400);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  // PENDING withdrawal summasini hisoblaymiz
  const pending = await prisma.withdrawal.aggregate({
    where: {
      userId,
      status: "PENDING",
    },
    _sum: {
      amount: true,
    },
  });

  const pendingSum = pending._sum.amount ?? new Prisma.Decimal(0);
  const availableBalance = user.balance.minus(pendingSum);

  if (availableBalance.lessThan(withdrawalAmount)) {
    throw new AppError("Insufficient balance", 400);
  }

  return prisma.withdrawal.create({
    data: {
      cardNumber,
      amount: withdrawalAmount,
      userId,
      status: "PENDING",
    },
  });
};

export const approveWithdrawalService = async (
  withdrawalId: number,
  operatorId: number,
) => {
  return prisma.$transaction(async (tx) => {
    const withdrawal = await tx.withdrawal.findUnique({
      where: { id: withdrawalId },
      include: { user: true },
    });

    if (!withdrawal) {
      throw new AppError("Withdrawal not found", 404);
    }

    if (withdrawal.status !== "PENDING") {
      throw new AppError("Withdrawal already processed", 400);
    }

    const user = withdrawal.user;

    if (user.balance.lessThan(withdrawal.amount)) {
      throw new AppError("User balance insufficient", 400);
    }

    // Balance kamaytiramiz
    await tx.user.update({
      where: { id: user.id },
      data: {
        balance: {
          decrement: withdrawal.amount,
        },
      },
    });

    // Balance history
    await tx.balanceHistory.create({
      data: {
        userId: user.id,
        amount: withdrawal.amount.mul(-1),
        type: "WITHDRAWAL",
        reference: `withdrawal:${withdrawalId}`,
      },
    });

    // Withdrawal update
    const updated = await tx.withdrawal.update({
      where: { id: withdrawalId },
      data: {
        status: "PAID",
        processedBy: operatorId,
        processedAt: new Date(),
      },
    });

    // Action log
    await tx.actionLog.create({
      data: {
        userId: operatorId,
        action: "PAY_WITHDRAWAL",
        entity: "WITHDRAWAL",
        entityId: withdrawalId,
        meta: JSON.stringify({
          targetUserId: user.id,
          amount: withdrawal.amount.toString(),
        }),
      },
    });

    return {
      message: "Withdrawal approved and balance deducted",
      telegramId: user.telegramId ? user.telegramId.toString() : null,
      amount: withdrawal.amount.toString(),
    };
  });
};

export const getMyWithdrawals = async (userId: number) => {
  return prisma.withdrawal.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
};

export const getAllWithdrawals = async (status?: WithdrawalStatus) => {
  return prisma.withdrawal.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          phone: true,
          telegramId: true,
        },
      },
    },
  });
};

export const cancelWithdrawalService = async (
  withdrawalId: number,
  userId: number,
) => {
  const withdrawal = await prisma.withdrawal.findUnique({
    where: { id: withdrawalId },
  });

  if (!withdrawal) {
    throw new AppError("Withdrawal not found", 404);
  }

  if (withdrawal.userId !== userId) {
    throw new AppError("Not allowed", 403);
  }

  if (withdrawal.status !== "PENDING") {
    throw new AppError("Cannot cancel processed withdrawal", 400);
  }

  const updated = await prisma.withdrawal.update({
    where: { id: withdrawalId },
    data: { status: "CANCELLED" },
  });

  await prisma.actionLog.create({
    data: {
      userId,
      action: "CANCEL_WITHDRAWAL",
      entity: "WITHDRAWAL",
      entityId: withdrawalId,
    },
  });

  return updated;
};

export const lockWithdrawalService = async (
  withdrawalId: number,
  operatorId: number,
) => {
  const withdrawal = await prisma.withdrawal.findUnique({
    where: { id: withdrawalId },
  });

  if (!withdrawal) {
    throw new AppError("Withdrawal not found", 404);
  }

  if (withdrawal.status !== "PENDING") {
    throw new AppError("Withdrawal already processed", 400);
  }

  // Agar lock bor bo‘lsa va 30 sekund o‘tmagan bo‘lsa
  if (withdrawal.lockedAt) {
    const diff = Date.now() - withdrawal.lockedAt.getTime();

    if (diff < 30000 && withdrawal.lockedBy !== operatorId) {
      throw new AppError("Withdrawal locked by another operator", 409);
    }
  }

  return prisma.withdrawal.update({
    where: { id: withdrawalId },
    data: {
      lockedBy: operatorId,
      lockedAt: new Date(),
    },
  });
};
