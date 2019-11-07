const mongoose = require("mongoose");
const Project = require("../models/project");

const create = async (req, res) => {
  const project = new Project({
    ...req.body,
    owner: req.user._id
  });

  try {
    // TODO: validate if ancestor and children exists in the database
    await project.save();
    res.status(201).send(project);
  } catch (error) {
    res.status(400).send(error);
  }
};

const list = async (req, res) => {
  try {
    await req.user
      .populate({
        path: "projects"
      })
      .execPopulate();
    res.send(req.user.projects);
  } catch (error) {
    res.status(400).send(error);
  }
};

const show = async (req, res) => {
  const _id = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).send({ error: "Invalid project id provided!" });
  }

  try {
    const project = await Project.findOne({ _id, owner: req.user._id });

    if (!project) {
      return res.status(404).send();
    }

    res.send(project);
  } catch (error) {
    res.status(500).send(error);
  }
};

const update = async (req, res) => {
  const _id = req.params.id;
  const owner = req.user.id;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).send({ error: "Invalid project id provided!" });
  }

  const updates = Object.keys(req.body);
  const allowedUpdates = Object.keys(Project.prototype.schema.obj);
  const isValidUpdate = updates.every(update =>
    allowedUpdates.includes(update)
  );

  if (!isValidUpdate) {
    return res.status(400).send({ error: "Invalid updates!" });
  }

  try {
    const project = await Project.findOne({ _id, owner });

    if (!project) {
      return res.status(404).send();
    }

    // TODO: validate if ancestor and children exists in the database

    updates.forEach(update => (project[update] = req.body[update]));
    await project.save();
    res.send(project);
  } catch (error) {
    res.status(400).send(error);
  }
};

const erase = async (req, res) => {
  const _id = req.params.id;
  const owner = req.user.id;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).send({ error: "Invalid project id provided!" });
  }

  try {
    const project = await Project.findOneAndDelete({ _id, owner });

    if (!project) {
      return res.status(404).send();
    }

    res.send(project);
  } catch (error) {
    res.status(400).send(error);
  }
};

module.exports = { create, list, show, update, erase };
