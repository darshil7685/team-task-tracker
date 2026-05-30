const router = require("express").Router();
const { taskAnalytics } = require("../controllers/analytics.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/rbac.middleware");

router.get(
  "/tasks",
  authenticate,
  authorize("ADMIN", "MANAGER"),
  taskAnalytics
);

module.exports = router;
