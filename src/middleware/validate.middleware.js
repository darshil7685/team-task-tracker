const { validationResult } = require("express-validator");
const ApiError = require("../utils/apiError");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors
      .array()
      .map((e) => e.msg)
      .join("; ");
    return next(ApiError.badRequest(messages, "VALIDATION_ERROR"));
  }
  next();
};

module.exports = { validate };
