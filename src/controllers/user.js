const mongoose = require("mongoose");
const sharp = require("sharp");
const User = require("../models/user");
const { sendWelcomeEmail, sendCancelationEmail } = require("../emails/account");

const save = async (req, res) => {
  const user = new User(req.body);
  user.admin = false;

  try {
    await user.save();
    sendWelcomeEmail(user.email, user.name);
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token });
  } catch (error) {
    res.status(400).send(error);
  }
};

const authenticate = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findByCredentials(email, password);
    const token = await user.generateAuthToken();
    res.send({ user, token });
  } catch (error) {
    res.status(401).send({ error: error.message });
  }
};

const unauthenticate = async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(token => {
      return token.token !== req.token;
    });
    await req.user.save();

    res.send({ message: "User logged out." });
  } catch (error) {
    res.status(500).send();
  }
};

const unauthenticateAll = async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();

    res.send({ message: "User logged out from all opened sessions." });
  } catch (error) {
    res.status(500).send();
  }
};

const profile = async (req, res) => {
  res.send(req.user);
};

const updateProfile = async (req, res) => {
  const user = req.user;

  const updates = Object.keys(req.body);
  const allowedUpdates = Object.keys(User.prototype.schema.obj);
  const isValidUpdate = updates.every(update =>
    allowedUpdates.includes(update)
  );

  if (!isValidUpdate) {
    return res.status(400).send({ error: "Invalid updates!" });
  }

  try {
    updates.forEach(update => (user[update] = req.body[update]));
    await user.save();
    res.send(user);
  } catch (error) {
    res.status(400).send(error);
  }
};

const eraseProfile = async (req, res) => {
  const user = req.user;

  try {
    await user.remove();
    sendCancelationEmail(user.email, user.name);
    res.send(user);
  } catch (error) {
    res.status(500).send(error);
  }
};

const saveAvatar = async (req, res) => {
  const user = req.user;

  const buffer = await sharp(req.file.buffer)
    .resize({ width: 250, height: 250 })
    .png()
    .toBuffer();

  user.avatar = buffer;

  try {
    await user.save();
    res.send();
  } catch (error) {
    res.status(500).send();
  }
};

const showAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || !user.avatar) {
      throw new Error();
    }

    res.set("Content-Type", "image/png");
    res.send(user.avatar);
  } catch (error) {
    res.status(404).send();
  }
};

const eraseAvatar = async (req, res) => {
  const user = req.user;
  user.avatar = undefined;

  try {
    await user.save();
    res.send();
  } catch (error) {
    res.status(500).send();
  }
};

const middlewareError = (error, req, res, next) => {
  res.status(400).send({ error: error.message });
};

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
  save,
  authenticate,
  unauthenticate,
  unauthenticateAll,
  profile,
  updateProfile,
  eraseProfile,
  saveAvatar,
  showAvatar,
  eraseAvatar,
  middlewareError,
  listAll,
  show,
  update,
  erase
};
