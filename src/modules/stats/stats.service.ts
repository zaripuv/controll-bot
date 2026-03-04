import prisma from "../../config/database";

export const getGlobalStats = async () => {
  const [
    totalSubmissions,
    approvedSubmissions,
    rejectedSubmissions,
    expiredSubmissions,
    totalWithdrawals,
    paidWithdrawals,
    cancelledWithdrawals,
    totalPaidAmount
  ] = await Promise.all([
    prisma.submission.count(),
    prisma.submission.count({ where: { status: "APPROVED" } }),
    prisma.submission.count({ where: { status: "REJECTED" } }),
    prisma.submission.count({ where: { status: "EXPIRED" } }),
    prisma.withdrawal.count(),
    prisma.withdrawal.count({ where: { status: "PAID" } }),
    prisma.withdrawal.count({ where: { status: "CANCELLED" } }),
    prisma.withdrawal.aggregate({
      _sum: { amount: true },
      where: { status: "PAID" }
    })
  ]);

  return {
    submissions: {
      total: totalSubmissions,
      approved: approvedSubmissions,
      rejected: rejectedSubmissions,
      expired: expiredSubmissions
    },
    withdrawals: {
      total: totalWithdrawals,
      paid: paidWithdrawals,
      cancelled: cancelledWithdrawals,
      totalPaidAmount: totalPaidAmount._sum.amount || 0
    }
  };
};

export const getVoteOperatorStats = async () => {
  return prisma.user.findMany({
    where: { role: "VOTE_OPERATOR" },
    select: {
      id: true,
      username: true,
      reviewedSubs: {
        select: {
          status: true
        }
      }
    }
  });
};

export const getPaymentOperatorStats = async () => {
  return prisma.user.findMany({
    where: { role: "PAYMENT_OPERATOR" },
    select: {
      id: true,
      username: true,
      processedWiths: {
        select: {
          status: true,
          amount: true
        }
      }
    }
  });
};