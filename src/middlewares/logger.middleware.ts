import pinoHttp from "pino-http";
import { logger } from "../shared/logger";

export const httpLogger = pinoHttp({
  logger,
});