const router = require("express").Router();
const {
  listTasks,
  getTask,
  createTask,
  updateTask,
  transitionStatus,
  deleteTask,
} = require("../controllers/task.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/rbac.middleware");
const {
  createTaskValidator,
  updateTaskValidator,
  statusTransitionValidator,
  listTasksValidator,
} = require("../validators/task.validator");
const { validate } = require("../middleware/validate.middleware");

router.get("/", authenticate, listTasksValidator, validate, listTasks);

router.get("/:id", authenticate, getTask);

router.post(
  "/",
  authenticate,
  authorize("ADMIN", "MANAGER"),
  createTaskValidator,
  validate,
  createTask
);

router.patch(
  "/:id",
  authenticate,
  authorize("ADMIN", "MANAGER"),
  updateTaskValidator,
  validate,
  updateTask
);

router.patch(
  "/:id/status",
  authenticate,
  statusTransitionValidator,
  validate,
  transitionStatus
);

router.delete("/:id", authenticate, authorize("ADMIN"), deleteTask);

module.exports = router;
