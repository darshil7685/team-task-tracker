const ApiError = require("../utils/apiError");

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized("Not authenticated"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Role '${req.user.role}' does not have access to this resource. Required: ${allowedRoles.join(" or ")}`
        )
      );
    }

    next();
  };
};

const sameOrg = (req, res, next) => {
  const orgId = req.params.orgId || req.body.organization;
  if (orgId && orgId.toString() !== req.user.organization.toString()) {
    return next(ApiError.forbidden("Access denied: cross-organization access"));
  }
  next();
};

module.exports = { authorize, sameOrg };
