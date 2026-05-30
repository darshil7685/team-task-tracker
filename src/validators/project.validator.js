const { body, param, query } = require("express-validator");
const { PROJECT_STATUSES } = require("../models/project.model");

const createProjectValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Project name is required")
    .isLength({ max: 150 })
    .withMessage("Project name must not exceed 150 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description must not exceed 1000 characters"),

  body("status")
    .optional()
    .isIn(PROJECT_STATUSES)
    .withMessage(`Status must be one of: ${PROJECT_STATUSES.join(", ")}`),

  body("members")
    .optional()
    .isArray()
    .withMessage("members must be an array of user IDs"),

  body("members.*")
    .optional()
    .isMongoId()
    .withMessage("Each member must be a valid user ID"),
];

const updateProjectValidator = [
  param("id").isMongoId().withMessage("Project ID is invalid"),

  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Project name cannot be empty")
    .isLength({ max: 150 })
    .withMessage("Project name must not exceed 150 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description must not exceed 1000 characters"),

  body("status")
    .optional()
    .isIn(PROJECT_STATUSES)
    .withMessage(`Status must be one of: ${PROJECT_STATUSES.join(", ")}`),
];

const assignMembersValidator = [
  param("id").isMongoId().withMessage("Project ID is invalid"),

  body("members")
    .isArray({ min: 1 })
    .withMessage("members must be a non-empty array of user IDs"),

  body("members.*")
    .isMongoId()
    .withMessage("Each member must be a valid user ID"),
];

const listProjectsValidator = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("page must be a positive integer")
    .toInt(),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit must be between 1 and 100")
    .toInt(),

  query("status")
    .optional()
    .isIn(PROJECT_STATUSES)
    .withMessage(`status must be one of: ${PROJECT_STATUSES.join(", ")}`),
];

module.exports = {
  createProjectValidator,
  updateProjectValidator,
  assignMembersValidator,
  listProjectsValidator,
};
