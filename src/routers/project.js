const express = require("express");
const auth = require("../middleware/auth");
const ProjectController = require("../controllers/project");

const router = express.Router();

router.post("/projects", auth, ProjectController.create);

module.exports = router;
