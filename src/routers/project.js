const express = require("express");
const auth = require("../middleware/auth");
const ProjectController = require("../controllers/project");

const router = express.Router();

router.post("/projects", auth, ProjectController.create);
router.get("/projects", auth, ProjectController.list);
router.get("/projects/:id", auth, ProjectController.show);
router.patch("/projects/:id", auth, ProjectController.update);

module.exports = router;
