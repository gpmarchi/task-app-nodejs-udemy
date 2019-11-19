const mongoose = require("mongoose");
const Project = require("../models/project");

const doesAncestorAndChildrenExistsInDatabase = async (
  ancestorId,
  owner,
  children
) => {
  if (ancestorId) {
    const ancestorProject = await Project.findOne({ _id: ancestorId, owner });
    if (!ancestorProject) {
      return false;
    }
  }

  if (children) {
    const childrenExists = async () => {
      for (const childId of children) {
        const childProject = await Project.findOne({
          _id: mongoose.Types.ObjectId(childId),
          owner
        });
        if (!childProject) {
          return false;
        }
      }
      return true;
    };

    if (!(await childrenExists())) {
      return false;
    }
  }

  return true;
};

const create = async (req, res) => {
  const owner = req.user._id;
  const ancestorId = req.body.ancestor;
  const children = req.body.children;

  const project = new Project({
    ...req.body,
    owner
  });

  try {
    const validationResult = await doesAncestorAndChildrenExistsInDatabase(
      ancestorId,
      owner,
      children
    );

    if (!validationResult) {
      return res.status(404).send();
    }

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
  const owner = req.user._id;
  const ancestorId = req.body.ancestor;
  const updatedChildren = req.body.children;

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

    const validationResult = await doesAncestorAndChildrenExistsInDatabase(
      ancestorId,
      owner,
      updatedChildren
    );

    if (!validationResult) {
      return res.status(404).send();
    }

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
    const project = await Project.findOne({ _id, owner });

    if (!project) {
      return res.status(404).send();
    }

    await project.remove();
    res.send(project);
  } catch (error) {
    res.status(500).send(error);
  }
};

module.exports = { create, list, show, update, erase };
