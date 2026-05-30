const logger = require("../utils/logger");
const ApiError = require("../utils/apiError");

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || "field";
    err = ApiError.conflict(
      `A record with this ${field} already exists`,
      "DUPLICATE_KEY"
    );
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors)
      .map((e) => e.message)
      .join("; ");
    err = ApiError.badRequest(messages, "VALIDATION_ERROR");
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === "CastError") {
    err = ApiError.badRequest(
      `Invalid value for field '${err.path}'`,
      "INVALID_ID"
    );
  }

  const statusCode = err.statusCode || 500;
  const code = err.code || "INTERNAL_SERVER_ERROR";
  const message = err.isOperational ? err.message : "An unexpected error occurred";

  if (!err.isOperational) {
    logger.error(err);
  } else {
    logger.warn(`[${code}] ${message}`);
  }

  res.status(statusCode).json({
    status: statusCode,
    code,
    message,
  });
};

module.exports = { errorHandler };
