const express = require("express");
const auth = require("../middleware/auth");
const avatarUpload = require("../middleware/upload");
const admin = require("../middleware/admin");
const UserController = require("../controllers/user");

const router = express.Router();

router.post("/users", UserController.save);
router.post("/users/login", UserController.authenticate);
router.post("/users/logout", auth, UserController.unauthenticate);
router.post("/users/logoutAll", auth, UserController.unauthenticateAll);
router.post(
  "/users/me/avatar",
  auth,
  avatarUpload.single("avatar"),
  UserController.saveAvatar,
  UserController.middlewareError
);

router.get("/users/me", auth, UserController.profile);
router.get("/users/:id/avatar", UserController.showAvatar);

router.patch("/users/me", auth, UserController.updateProfile);

router.delete("/users/me", auth, UserController.eraseProfile);
router.delete("/users/me/avatar", auth, UserController.eraseAvatar);

// TODO: implement pagination, filtering and sorting with tests
router.get("/admin/users", auth, admin, UserController.listAll);
router.get("/admin/users/:id", auth, admin, UserController.show);
router.patch("/admin/users/:id", auth, admin, UserController.update);
router.delete("/admin/users/:id", auth, admin, UserController.erase);

module.exports = router;
