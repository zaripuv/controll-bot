import prisma from "../../config/database";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Prisma } from "@prisma/client";
import { AppError } from "../../shared/appError";

const generateAccessToken = (user: any) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET!, {
    expiresIn: "15m",
  });

const generateRefreshToken = (user: any) =>
  jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: "7d",
  });

const generateReferralCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  let code = "";

  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return code;
};

export const loginUser = async (username: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { username } });

  if (!user) {
    throw new AppError("Invalid credentials", 400);
  }

  const isMatch = await bcrypt.compare(password, user.password!);

  if (!isMatch) {
    throw new AppError("Invalid credentials", 400);
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return { accessToken, refreshToken, role: user.role };
};

export const refreshAccessToken = async (token: string) => {
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token },
  });

  if (!storedToken) {
    throw new AppError("Invalid refresh token", 403);
  }

  if (storedToken.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { token } });

    throw new AppError("Refresh token expired", 403);
  }

  const decoded: any = jwt.verify(token, process.env.JWT_REFRESH_SECRET!);

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  await prisma.refreshToken.delete({ where: { token } });

  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  await prisma.refreshToken.create({
    data: {
      token: newRefreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

export const telegramLogin = async (
  telegramId: string,
  referralCode?: string,
) => {
  let user = await prisma.user.findUnique({
    where: { telegramId: BigInt(telegramId) },
  });

  if (!user) {
    return prisma.$transaction(async (tx) => {
      let referrerId: number | null = null;

      if (referralCode) {
        const referrer = await tx.user.findUnique({
          where: { referralCode },
        });

        if (referrer) {
          if (referrer.telegramId === BigInt(telegramId)) {
            referrerId = null;
          } else {
            referrerId = referrer.id;
          }
        }
      }

      const newUser = await tx.user.create({
        data: {
          telegramId: BigInt(telegramId),
          role: "USER",
          referralCode: generateReferralCode(),
          referredBy: referrerId,
        },
      });

      if (referrerId) {
        const reward = new Prisma.Decimal(5000);

        await tx.user.update({
          where: { id: referrerId },
          data: {
            balance: {
              increment: reward,
            },
          },
        });

        await tx.balanceHistory.create({
          data: {
            userId: referrerId,
            amount: reward,
            type: "REFERRAL",
            reference: `referral:${newUser.id}`,
          },
        });
      }

      const accessToken = generateAccessToken(newUser);
      const refreshToken = generateRefreshToken(newUser);

      await tx.refreshToken.create({
        data: {
          token: refreshToken,
          userId: newUser.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      return {
        accessToken,
        refreshToken,
        role: newUser.role,
      };
    });
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return { accessToken, refreshToken, role: user.role };
};

export const logoutUser = async (token: string) => {
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token },
  });

  if (!storedToken) {
    throw new AppError("Refresh token not found", 404);
  }

  await prisma.refreshToken.delete({
    where: { token },
  });

  return { message: "Logged out successfully" };
};
