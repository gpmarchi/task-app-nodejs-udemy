const sharp = require("sharp");
const User = require("../models/user");

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

module.exports = {
  saveAvatar,
  showAvatar,
  eraseAvatar,
  middlewareError
};
