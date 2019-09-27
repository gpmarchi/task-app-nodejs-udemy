const User = require("../models/user");

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

module.exports = {
  authenticate,
  unauthenticate,
  unauthenticateAll
};
