import prisma from "../../config/database";

export const createProjectService = async (
  name: string,
  link: string,
  reward: number,
  voteOperatorId?: number,
  paymentOperatorId?: number
) => {

  const project = await prisma.project.create({
    data: {
      name,
      link,
      reward,
      voteOperatorId,
      paymentOperatorId
    }
  });

  return project;
};

export const getProjects = async () => {
  return prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      voteOperator: { select: { id: true, username: true } },
      paymentOperator: { select: { id: true, username: true } },
    },
  });
};

export const getProjectStats = async (projectId: number) => {
  const [
    total,
    approved,
    rejected,
    expired,
    paidWithdrawals,
    totalPaid
  ] = await Promise.all([
    prisma.submission.count({ where: { projectId } }),
    prisma.submission.count({ where: { projectId, status: "APPROVED" } }),
    prisma.submission.count({ where: { projectId, status: "REJECTED" } }),
    prisma.submission.count({ where: { projectId, status: "EXPIRED" } }),
    prisma.withdrawal.count({ where: { status: "PAID" } }),
    prisma.withdrawal.aggregate({
      _sum: { amount: true },
      where: { status: "PAID" },
    }),
  ]);

  return {
    submissions: { total, approved, rejected, expired },
    withdrawals: {
      paid: paidWithdrawals,
      totalPaidAmount: totalPaid._sum.amount || 0,
    },
  };
};