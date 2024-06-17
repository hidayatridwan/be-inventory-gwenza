import { logger } from "./application/logging.js";
import { web } from "./application/web.js";

const port = process.env.APP_PORT;

web.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});
