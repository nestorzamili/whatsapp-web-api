import morgan from "morgan";
import logger from "../config/logger";

const stream = {
  write: (message: string) => logger.http(message.trim()),
};

const morganFormat = () => {
  const env = process.env.NODE_ENV || "development";
  if (env === "production") {
    return ":remote-addr :method :url :status :response-time ms";
  }
  return ":remote-addr :method :url :status :res[content-length] - :response-time ms :referrer :user-agent";
};

const morganMiddleware = morgan(morganFormat(), { stream });

export default morganMiddleware;
