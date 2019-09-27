const express = require("express");
const auth = require("../middleware/auth");
const avatarUpload = require("../middleware/upload");
const AvatarController = require("../controllers/avatar");

const router = express.Router();

router.get("/users/:id/avatar", AvatarController.showAvatar);
router.post(
  "/users/me/avatar",
  auth,
  avatarUpload.single("avatar"),
  AvatarController.saveAvatar,
  AvatarController.middlewareError
);
router.delete("/users/me/avatar", auth, AvatarController.eraseAvatar);

module.exports = router;
