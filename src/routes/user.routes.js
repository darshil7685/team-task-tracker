const router = require("express").Router();
const {
  listUsers,
  getUser,
  updateUser,
  deactivateUser,
} = require("../controllers/user.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/rbac.middleware");
const { updateUserValidator } = require("../validators/user.validator");
const { validate } = require("../middleware/validate.middleware");

router.get("/", authenticate, authorize("ADMIN"), listUsers);

router.get("/:id", authenticate, getUser);

router.patch(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  updateUserValidator,
  validate,
  updateUser
);

router.delete("/:id", authenticate, authorize("ADMIN"), deactivateUser);

module.exports = router;
