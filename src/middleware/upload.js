const multer = require("multer");

const avatarUpload = multer({
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

module.exports = avatarUpload;
