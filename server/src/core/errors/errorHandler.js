import { logger } from "../../config/logger.js";
import { AppError } from "./AppError.js";

export const errorHandler = (error, req, res, next) => {
  logger.error(error.message, {
    method: req.method,
    path: req.originalUrl,
    stack:
      process.env.NODE_ENV !== "production"
        ? error.stack
        : undefined,
  });

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    });
  }

  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Something went wrong on the server.",
    },
  });
};