const admin = async (req, res, next) => {
  try {
    const user = req.user;

    if (!user.admin) {
      throw new Error();
    }

    next();
  } catch (error) {
    res.status(403).send();
  }
};

module.exports = admin;
