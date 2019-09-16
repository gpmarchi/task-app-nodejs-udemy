const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const sharp = require("sharp");
const User = require("../models/user");
const auth = require("../middleware/auth");

const router = express.Router();

router.post("/users", async (req, res) => {
  const user = new User(req.body);

  try {
    await user.save();
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token });
  } catch (error) {
    res.status(400).send(error);
  }
});

router.post("/users/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findByCredentials(email, password);
    const token = await user.generateAuthToken();
    res.send({ user, token });
  } catch (error) {
    res.status(401).send({ error: error.message });
  }
});

router.post("/users/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(token => {
      return token.token !== req.token;
    });
    await req.user.save();

    res.send({ message: "User logged out." });
  } catch (error) {
    res.status(500).send();
  }
});

router.post("/users/logoutAll", auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();

    res.send({ message: "User logged out from all opened sessions." });
  } catch (error) {
    res.status(500).send();
  }
});

router.get("/users/me", auth, async (req, res) => {
  res.send(req.user);
});

// TODO: protect this route with authentication and only allow admin users to
// access
router.get("/users", async (req, res) => {
  try {
    const users = await User.find({});

    if (!users) {
      res.status(404).send();
    }

    res.send(users);
  } catch (error) {
    res.status(500).send(error);
  }
});

// TODO: leave off this route for admin purposes, change user model to suport
// admin only access to this method
router.get("/users/:id", async (req, res) => {
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
});

// TODO: when refactoring this method for use with the controller, unify both
// methods for dealing with user updates from the user or admin checking to see
// if there is a user in the request or if there is an id in the params object
router.patch("/users/me", auth, async (req, res) => {
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
});

// TODO: leave off this route for admin purposes, change user model to suport
// admin only access to this method
router.patch("/users/:id", async (req, res) => {
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
});

router.delete("/users/me", auth, async (req, res) => {
  const user = req.user;

  try {
    await user.remove();
    res.send(user);
  } catch (error) {
    res.status(500).send(error);
  }
});

// TODO: leave off this route for admin purposes, change user model to suport
// admin only access to this method
router.delete("/users/:id", auth, async (req, res) => {
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
});

const upload = multer({
  limits: {
    fileSize: 1000000
  },
  fileFilter(req, file, callback) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return callback(
        new Error("Invalid file extension, please use .jpg, .jpeg or .png!")
      );
    }

    callback(undefined, true);
  }
});

router.post(
  "/users/me/avatar",
  auth,
  upload.single("avatar"),
  async (req, res) => {
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
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

router.delete("/users/me/avatar", auth, async (req, res) => {
  const user = req.user;
  user.avatar = undefined;

  try {
    await user.save();
    res.send();
  } catch (error) {
    res.status(500).send();
  }
});

router.get("/users/:id/avatar", async (req, res) => {
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
});

module.exports = router;
