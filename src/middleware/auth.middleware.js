const { verifyAccessToken } = require("../utils/jwt.utils");
const User = require("../models/user.model");
const ApiError = require("../utils/apiError");

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw ApiError.unauthorized("No access token provided");
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      const msg =
        err.name === "TokenExpiredError"
          ? "Access token expired"
          : "Invalid access token";
      throw ApiError.unauthorized(msg);
    }

    const user = await User.findById(decoded.userId).lean();
    if (!user || !user.isActive) {
      throw ApiError.unauthorized("User not found or deactivated");
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { authenticate };
