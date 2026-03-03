import "dotenv/config";
import app from "./app";
import prisma from "./config/database";


(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

const PORT = process.env.PORT || 5000;

const seedSystemConfig = async () => {
  const reward = await prisma.systemConfig.findUnique({
    where: { key: "reward" }
  });

  if (!reward) {
    await prisma.systemConfig.create({
      data: {
        key: "reward",
        value: "30000"
      }
    });

    console.log("✅ Default reward config created");
  }
};

const start = async () => {
  try {
    await prisma.$connect();
    console.log("✅ Database connected");

    await seedSystemConfig();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error("❌ Server failed to start:", error);
    process.exit(1);
  }

  console.log("JWT_SECRET:", process.env.JWT_SECRET);
};

start();