const express = require("express");
const auth = require("../middleware/auth");
const UserController = require("../controllers/user");

const router = express.Router();

router.get("/users/me", auth, UserController.profile);
router.post("/users", UserController.save);
router.patch("/users/me", auth, UserController.updateProfile);
router.delete("/users/me", auth, UserController.eraseProfile);

module.exports = router;
