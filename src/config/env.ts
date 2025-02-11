import dotenv from "dotenv";
import path from "path";
import logger from "./logger";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const requiredEnv = ["PORT", "API_KEY", "SESSION_PATH", "NODE_ENV"];
requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    logger.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
});

export const config = {
  port: process.env.PORT || 3000,
  apiKey: process.env.API_KEY as string,
  sessionPath: process.env.SESSION_PATH as string,
  nodeEnv: process.env.NODE_ENV as string,
};
