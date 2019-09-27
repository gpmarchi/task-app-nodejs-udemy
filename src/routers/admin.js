const express = require("express");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const AdminController = require("../controllers/admin");

const router = express.Router();

// TODO: implement pagination, filtering and sorting with tests
router.get("/admin/users", auth, admin, AdminController.listAll);
router.get("/admin/users/:id", auth, admin, AdminController.show);
router.patch("/admin/users/:id", auth, admin, AdminController.update);
router.delete("/admin/users/:id", auth, admin, AdminController.erase);

module.exports = router;
