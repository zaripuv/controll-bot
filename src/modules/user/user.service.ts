import prisma from "../../config/database";

export const getReferralLink = async (userId: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  return {
    code: user?.referralCode,
    link: `https://t.me/open_budgetttt_bot?start=${user?.referralCode}`,
  };
};

export const getReferralStats = async (userId: number) => {
  const referrals = await prisma.user.count({
    where: {
      referredBy: userId,
    },
  });

  const reward = await prisma.balanceHistory.aggregate({
    where: {
      userId,
      type: "REFERRAL",
    },
    _sum: {
      amount: true,
    },
  });

  return {
    totalReferrals: referrals,
    totalEarned: reward._sum.amount || 0,
  };
};

export const topReferrers = async () => {
  const users = await prisma.user.findMany({
    take: 10,
    select: {
      id: true,
      username: true,
      referralCode: true,
      referrals: {
        select: {
          id: true,
        },
      },
    },
  });

  return users
    .map((u) => ({
      username: u.username,
      referrals: u.referrals.length,
    }))
    .sort((a, b) => b.referrals - a.referrals);
};
