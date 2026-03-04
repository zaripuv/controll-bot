import "dotenv/config";
import app from "./app";
import prisma from "./config/database";
import { logger } from "./shared/logger";

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await prisma.$connect();
    logger.info("Database connected");

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error("Server failed to start:", error);
    process.exit(1);
  }
};

start();