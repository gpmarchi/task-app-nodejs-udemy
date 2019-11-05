const Project = require("../models/project");

const create = async (req, res) => {
  const project = new Project({
    ...req.body,
    owner: req.user._id
  });

  try {
    await project.save();
    res.status(201).send(project);
  } catch (error) {
    res.status(400).send(error);
  }
};

module.exports = { create };
