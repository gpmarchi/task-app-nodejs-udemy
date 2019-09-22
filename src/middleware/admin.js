const User = require("../models/user");

const admin = async (req, res, next) => {
  try {
    const user = req.user;

    if (!user.admin) {
      throw new Error();
    }

    next();
  } catch (error) {
    res.status(400).send();
  }
};

module.exports = admin;
