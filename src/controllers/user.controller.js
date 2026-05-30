const User = require("../models/user.model");
const ApiError = require("../utils/apiError");

/**
 * GET /api/users
 * ADMIN only — list all users in the same organization.
 */
const listUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, isActive } = req.query;
    const skip = (page - 1) * limit;

    const filter = { organization: req.user.organization };
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-refreshTokens")
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      User.countDocuments(filter),
    ]);

    res.json({
      data: users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/users/:id
 * ADMIN can see any user in org; others can only see themselves.
 */
const getUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isSelf = id === req.user._id.toString();

    if (!isSelf && req.user.role !== "ADMIN") {
      throw ApiError.forbidden("You can only view your own profile");
    }

    const user = await User.findOne({
      _id: id,
      organization: req.user.organization,
    }).lean();

    if (!user) throw ApiError.notFound("User not found");

    res.json({ data: user });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/users/:id
 * ADMIN only — update name, role, isActive.
 */
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, role, isActive } = req.body;

    const user = await User.findOne({
      _id: id,
      organization: req.user.organization,
    });
    if (!user) throw ApiError.notFound("User not found");

    if (name !== undefined) user.name = name;
    if (role !== undefined) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    res.json({ data: user.toJSON() });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/users/:id  (soft delete — sets isActive=false)
 * ADMIN only.
 */
const deactivateUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === req.user._id.toString()) {
      throw ApiError.badRequest("You cannot deactivate your own account");
    }

    const user = await User.findOneAndUpdate(
      { _id: id, organization: req.user.organization },
      { isActive: false },
      { new: true }
    );
    if (!user) throw ApiError.notFound("User not found");

    res.json({ message: "User deactivated", data: user.toJSON() });
  } catch (err) {
    next(err);
  }
};

module.exports = { listUsers, getUser, updateUser, deactivateUser };
