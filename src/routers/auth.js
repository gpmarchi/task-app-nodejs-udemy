const express = require("express");
const auth = require("../middleware/auth");
const AuthController = require("../controllers/auth");

const router = express.Router();

router.post("/users/login", AuthController.authenticate);
router.patch("/users/logout", auth, AuthController.unauthenticate);
router.delete("/users/logoutAll", auth, AuthController.unauthenticateAll);

module.exports = router;
