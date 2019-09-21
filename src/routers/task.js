const express = require("express");
const auth = require("../middleware/auth");
const TaskController = require("../controllers/task");

const router = express.Router();

router.post("/tasks", auth, TaskController.create);

// GET /tasks?completed=true
// GET /tasks?limit10&skip=0
// GET /tasks?sortBy=createdAt:desc
router.get("/tasks", auth, TaskController.list);
router.get("/tasks/:id", auth, TaskController.show);

router.patch("/tasks/:id", auth, TaskController.update);

router.delete("/tasks/:id", auth, TaskController.erase);

module.exports = router;
