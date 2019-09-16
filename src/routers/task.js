const express = require("express");
const mongoose = require("mongoose");

const Task = require("../models/task");
const auth = require("../middleware/auth");

const router = express.Router();

router.post("/tasks", auth, async (req, res) => {
  const task = new Task({
    ...req.body,
    owner: req.user._id
  });

  try {
    await task.save();
    res.status(201).send(task);
  } catch (error) {
    res.status(400).send(error);
  }
});

// GET /tasks?completed=true
// GET /tasks?limit10&skip=0
// GET /tasks?sortBy=createdAt:desc
router.get("/tasks", auth, async (req, res) => {
  const match = {};
  const completed = req.query.completed;

  const sort = {};
  const sortBy = req.query.sortBy;

  if (completed) {
    match.completed = completed === "true";
  }

  if (sortBy) {
    const sortParts = sortBy.split(":");
    sort[sortParts[0]] = sortParts[1] === "desc" ? -1 : 1;
  }

  try {
    await req.user
      .populate({
        path: "tasks",
        match,
        options: {
          limit: parseInt(req.query.limit),
          skip: parseInt(req.query.skip),
          sort
        }
      })
      .execPopulate();
    res.send(req.user.tasks);
  } catch (error) {
    res.status(500).send();
  }
});

router.get("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).send({ error: "Invalid task id provided!" });
  }

  try {
    const task = await Task.findOne({ _id, owner: req.user._id });

    if (!task) {
      return res.status(404).send();
    }

    res.send(task);
  } catch (error) {
    log(error);
    res.status(500).send(error);
  }
});

router.patch("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;
  const owner = req.user.id;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).send({ error: "Invalid task id provided!" });
  }

  const updates = Object.keys(req.body);
  const allowedUpdates = Object.keys(Task.prototype.schema.obj);
  const isValidUpdate = updates.every(update =>
    allowedUpdates.includes(update)
  );

  if (!isValidUpdate) {
    return res.status(400).send({ error: "Invalid updates!" });
  }

  try {
    const task = await Task.findOne({ _id, owner });

    if (!task) {
      return res.status(404).send();
    }

    updates.forEach(update => (task[update] = req.body[update]));
    await task.save();
    res.send(task);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.delete("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;
  const owner = req.user.id;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).send({ error: "Invalid task id provided!" });
  }

  try {
    const task = await Task.findOneAndDelete({ _id, owner });

    if (!task) {
      return res.status(404).send();
    }

    res.send(task);
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
