const { body } = require("express-validator");

const registerValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ max: 100 })
    .withMessage("Name must not exceed 100 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),

  body("organizationName")
    .if(body("organizationId").not().exists())
    .trim()
    .notEmpty()
    .withMessage("organizationName is required when organizationId is not provided"),

  body("role")
    .optional()
    .isIn(["ADMIN", "MANAGER", "MEMBER"])
    .withMessage("Role must be ADMIN, MANAGER, or MEMBER"),
];

const loginValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),

  body("password").notEmpty().withMessage("Password is required"),
];

const refreshValidator = [
  body("refreshToken")
    .notEmpty()
    .withMessage("refreshToken is required"),
];

module.exports = { registerValidator, loginValidator, refreshValidator };
