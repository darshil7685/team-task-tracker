const router = require("express").Router();
const {
  listProjects,
  getProject,
  createProject,
  updateProject,
  assignMembers,
  removeMember,
  deleteProject,
} = require("../controllers/project.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/rbac.middleware");
const {
  createProjectValidator,
  updateProjectValidator,
  assignMembersValidator,
  listProjectsValidator,
} = require("../validators/project.validator");
const { validate } = require("../middleware/validate.middleware");
const { param } = require("express-validator");

router.get("/", authenticate, listProjectsValidator, validate, listProjects);

router.get("/:id", authenticate, getProject);

router.post(
  "/",
  authenticate,
  authorize("ADMIN", "MANAGER"),
  createProjectValidator,
  validate,
  createProject
);

router.patch(
  "/:id",
  authenticate,
  authorize("ADMIN", "MANAGER"),
  updateProjectValidator,
  validate,
  updateProject
);

router.post(
  "/:id/assign-members",
  authenticate,
  authorize("ADMIN", "MANAGER"),
  assignMembersValidator,
  validate,
  assignMembers
);

router.delete(
  "/:id/members/:userId",
  authenticate,
  authorize("ADMIN", "MANAGER"),
  [
    param("id").isMongoId().withMessage("Project ID is invalid"),
    param("userId").isMongoId().withMessage("User ID is invalid"),
  ],
  validate,
  removeMember
);

router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  deleteProject
);

module.exports = router;
