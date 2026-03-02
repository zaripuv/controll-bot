import prisma from "../../config/database";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const generateAccessToken = (user: any) =>
  jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: "15m" }
  );

const generateRefreshToken = (user: any) =>
  jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: "7d" }
  );

export const loginUser = async (username: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { username } });

  if (!user) {
    const error: any = new Error("Invalid credentials");
    error.statusCode = 400;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password!);

  if (!isMatch) {
    const error: any = new Error("Invalid credentials");
    error.statusCode = 400;
    throw error;
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  });

  return { accessToken, refreshToken, role: user.role };
};

export const refreshAccessToken = async (token: string) => {
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token }
  });

  if (!storedToken) {
    const error: any = new Error("Invalid refresh token");
    error.statusCode = 403;
    throw error;
  }

  if (storedToken.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { token } });

    const error: any = new Error("Refresh token expired");
    error.statusCode = 403;
    throw error;
  }

  const decoded: any = jwt.verify(
    token,
    process.env.JWT_REFRESH_SECRET!
  );

  const user = await prisma.user.findUnique({
    where: { id: decoded.id }
  });

  if (!user) {
    const error: any = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  await prisma.refreshToken.delete({ where: { token } });

  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  await prisma.refreshToken.create({
    data: {
      token: newRefreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken
  };
};

export const telegramLogin = async (telegramId: string) => {
  let user = await prisma.user.findUnique({
    where: { telegramId: BigInt(telegramId) }
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        telegramId: BigInt(telegramId),
        role: "USER"
      }
    });
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  });

  return { accessToken, refreshToken, role: user.role };
};

export const logoutUser = async (token: string) => {
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token }
  });

  if (!storedToken) {
    const error: any = new Error("Refresh token not found");
    error.statusCode = 404;
    throw error;
  }

  await prisma.refreshToken.delete({
    where: { token }
  });

  return { message: "Logged out successfully" };
};