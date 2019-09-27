const mongoose = require("mongoose");
const User = require("../models/user");

const listAll = async (req, res) => {
  try {
    const users = await User.find({});

    if (!users) {
      res.status(404).send();
    }

    res.send(users);
  } catch (error) {
    res.status(500).send(error);
  }
};

const show = async (req, res) => {
  const _id = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).send({ error: "Invalid user id provided!" });
  }

  try {
    const user = await User.findById(_id);

    if (!user) {
      return res.status(404).send();
    }

    res.send(user);
  } catch (error) {
    res.status(500).send(error);
  }
};

const update = async (req, res) => {
  const _id = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).send({ error: "Invalid user id provided!" });
  }

  const updates = Object.keys(req.body);
  const allowedUpdates = Object.keys(User.prototype.schema.obj);
  const isValidUpdate = updates.every(update =>
    allowedUpdates.includes(update)
  );

  if (!isValidUpdate) {
    return res.status(400).send({ error: "Invalid updates!" });
  }

  try {
    const user = await User.findById(_id);

    updates.forEach(update => (user[update] = req.body[update]));
    await user.save();

    if (!user) {
      return res.status(404).send();
    }

    res.send(user);
  } catch (error) {
    res.status(400).send(error);
  }
};

const erase = async (req, res) => {
  const _id = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).send({ error: "Invalid user id provided!" });
  }

  try {
    const user = await User.findByIdAndDelete(_id);

    if (!user) {
      return res.status(404).send();
    }

    res.send(user);
  } catch (error) {
    res.status(500).send(error);
  }
};

module.exports = {
  listAll,
  show,
  update,
  erase
};
