const User = require("../models/user.model");
const Organization = require("../models/organization.model");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwt.utils");
const ApiError = require("../utils/apiError");

const register = async (req, res, next) => {
  
  try {
    const { name, email, password, organizationName, organizationId, role } = req.body;

    let org;
    let assignedRole = role || "MEMBER";

    if (organizationId) {
      org = await Organization.findById(organizationId);
      if (!org) throw ApiError.notFound("Organization not found");
    } else {
      org = await Organization.create({ name: organizationName });
      assignedRole = "ADMIN";
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw ApiError.conflict("An account with this email already exists", "EMAIL_TAKEN");
    }

    const user = await User.create({
      name,
      email,
      password,
      role: assignedRole,
      organization: org._id,
    });

    const accessToken = generateAccessToken({
      userId: user._id,
      role: user.role,
      orgId: user.organization,
    });
    const refreshToken = generateRefreshToken({ userId: user._id });

    await User.findByIdAndUpdate(user._id, {
      $push: { refreshTokens: refreshToken },
    });

    res.status(201).json({
      user: user.toJSON(),
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password +refreshTokens");
    if (!user || !(await user.comparePassword(password))) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    if (!user.isActive) {
      throw ApiError.forbidden("Your account has been deactivated");
    }

    const accessToken = generateAccessToken({
      userId: user._id,
      role: user.role,
      orgId: user.organization,
    });
    const refreshToken = generateRefreshToken({ userId: user._id });

    const updatedTokens = [...(user.refreshTokens || []), refreshToken].slice(-5);
    user.refreshTokens = updatedTokens;
    await user.save();

    res.json({
      user: user.toJSON(),
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      throw ApiError.unauthorized("Invalid or expired refresh token");
    }

    const user = await User.findById(decoded.userId).select("+refreshTokens");
    if (!user || !user.refreshTokens.includes(refreshToken)) {
      if (user) {
        user.refreshTokens = [];
        await user.save();
      }
      throw ApiError.unauthorized("Refresh token reuse detected. Please log in again.");
    }

    const newAccessToken = generateAccessToken({
      userId: user._id,
      role: user.role,
      orgId: user.organization,
    });
    const newRefreshToken = generateRefreshToken({ userId: user._id });

    user.refreshTokens = user.refreshTokens
      .filter((t) => t !== refreshToken)
      .concat(newRefreshToken)
      .slice(-5);
    await user.save();

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken && req.user) {
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { refreshTokens: refreshToken },
      });
    }

    res.json({ message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
};

const me = async (req, res) => {
  res.json({ user: req.user });
};

module.exports = { register, login, refresh, logout, me };
