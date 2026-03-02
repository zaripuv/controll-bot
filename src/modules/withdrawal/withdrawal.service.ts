import prisma from "../../config/database";
import { Prisma, WithdrawalStatus } from "@prisma/client";

export const createWithdrawalService = async (
  userId: number,
  cardNumber: string,
  amount: number
) => {
  if (!cardNumber || !amount) {
    throw new Error("cardNumber and amount required");
  }

  const withdrawalAmount = new Prisma.Decimal(amount);

  if (withdrawalAmount.lte(0)) {
    throw new Error("Amount must be greater than 0");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.balance.lessThan(withdrawalAmount)) {
    throw new Error("Insufficient balance");
  }

  return prisma.withdrawal.create({
    data: {
      cardNumber,
      amount: withdrawalAmount,
      userId
    }
  });
};

export const approveWithdrawalService = async (
  withdrawalId: number,
  operatorId: number
) => {
  return prisma.$transaction(async (tx) => {

    const withdrawal = await tx.withdrawal.findUnique({
      where: { id: withdrawalId }
    });

    if (!withdrawal) {
      throw new Error("Withdrawal not found");
    }

    if (withdrawal.status !== "PENDING") {
      throw new Error("Withdrawal already processed");
    }

    const user = await tx.user.findUnique({
      where: { id: withdrawal.userId }
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (user.balance.lessThan(withdrawal.amount)) {
      throw new Error("User balance insufficient");
    }

    await tx.user.update({
      where: { id: user.id },
      data: {
        balance: {
          decrement: withdrawal.amount
        }
      }
    });

    await tx.withdrawal.update({
      where: { id: withdrawalId },
      data: {
        status: "PAID",
        processedBy: operatorId,
        processedAt: new Date()
      }
    });

    return { message: "Withdrawal approved and balance deducted" };
  });
};

export const getMyWithdrawals = async (userId: number) => {
  return prisma.withdrawal.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" }
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
          phone: true
        }
      }
    }
  });
};

export const cancelWithdrawalService = async (
  withdrawalId: number,
  userId: number
) => {
  const withdrawal = await prisma.withdrawal.findUnique({
    where: { id: withdrawalId }
  });

  if (!withdrawal) {
    throw new Error("Withdrawal not found");
  }

  if (withdrawal.userId !== userId) {
    throw new Error("Not allowed");
  }

  if (withdrawal.status !== "PENDING") {
    throw new Error("Cannot cancel processed withdrawal");
  }

  return prisma.withdrawal.update({
    where: { id: withdrawalId },
    data: { status: "CANCELLED" }
  });
};