import { logger } from "../application/logging.js";

class ResponseError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;

    logger.error(`status: ${status}, message: ${message}`);
  }
}

export { ResponseError };
