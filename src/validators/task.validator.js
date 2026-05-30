const { body, query, param } = require("express-validator");
const { PRIORITIES, STATUSES } = require("../models/task.model");

const createTaskValidator = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ max: 200 })
    .withMessage("Title must not exceed 200 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Description must not exceed 2000 characters"),

  body("priority")
    .optional()
    .isIn(PRIORITIES)
    .withMessage(`Priority must be one of: ${PRIORITIES.join(", ")}`),

  body("assignee")
    .optional()
    .isMongoId()
    .withMessage("assignee must be a valid user ID"),

  body("due_date")
    .optional()
    .isISO8601()
    .withMessage("due_date must be a valid ISO 8601 date")
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error("due_date must be a future date");
      }
      return true;
    }),

  body("project")
    .optional({ nullable: true })
    .isMongoId()
    .withMessage("project must be a valid project ID"),
];

const updateTaskValidator = [
  param("id").isMongoId().withMessage("Task ID is invalid"),

  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Title cannot be empty")
    .isLength({ max: 200 })
    .withMessage("Title must not exceed 200 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Description must not exceed 2000 characters"),

  body("priority")
    .optional()
    .isIn(PRIORITIES)
    .withMessage(`Priority must be one of: ${PRIORITIES.join(", ")}`),

  body("assignee")
    .optional({ nullable: true })
    .isMongoId()
    .withMessage("assignee must be a valid user ID"),

  body("due_date")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("due_date must be a valid ISO 8601 date")
    .custom((value) => {
      if (value && new Date(value) <= new Date()) {
        throw new Error("due_date must be a future date");
      }
      return true;
    }),

  body("project")
    .optional({ nullable: true })
    .isMongoId()
    .withMessage("project must be a valid project ID"),

  body("status")
    .not()
    .exists()
    .withMessage("Use PATCH /tasks/:id/status to change task status"),
];

const statusTransitionValidator = [
  param("id").isMongoId().withMessage("Task ID is invalid"),

  body("status")
    .notEmpty()
    .withMessage("status is required")
    .isIn(STATUSES)
    .withMessage(`status must be one of: ${STATUSES.join(", ")}`),
];

const listTasksValidator = [
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
    .isIn(STATUSES)
    .withMessage(`status must be one of: ${STATUSES.join(", ")}`),

  query("priority")
    .optional()
    .isIn(PRIORITIES)
    .withMessage(`priority must be one of: ${PRIORITIES.join(", ")}`),

  query("assignee")
    .optional()
    .isMongoId()
    .withMessage("assignee must be a valid user ID"),

  query("project")
    .optional()
    .isMongoId()
    .withMessage("project must be a valid project ID"),
];

module.exports = {
  createTaskValidator,
  updateTaskValidator,
  statusTransitionValidator,
  listTasksValidator,
};
