const { body, param } = require("express-validator");

const updateUserValidator = [
  param("id").isMongoId().withMessage("User ID is invalid"),

  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Name cannot be empty")
    .isLength({ max: 100 })
    .withMessage("Name must not exceed 100 characters"),

  body("role")
    .optional()
    .isIn(["ADMIN", "MANAGER", "MEMBER"])
    .withMessage("Role must be ADMIN, MANAGER, or MEMBER"),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
];

module.exports = { updateUserValidator };
