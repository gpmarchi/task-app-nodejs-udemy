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

module.exports = {
  save,
  profile,
  updateProfile,
  eraseProfile
};
