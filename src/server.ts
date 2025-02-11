import app from "./app";
import { config } from "./config/env";
import logger from "./config/logger";

const PORT = config.port;

app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
});
