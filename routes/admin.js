const express = require("express");
const router = express.Router();
const userControllers = require("../controllers/userControllers");
const categoryControllers = require("../controllers/categoryControllers");

const { verifyToken } = require("../middleware/auth");

router.get("/get_all_users", verifyToken, userControllers.getAllUsers);
router.delete("/delete_user/:id", verifyToken, userControllers.deleteUser);

router.post("/create_category", verifyToken, categoryControllers.createCategory);
router.patch("/patch_category/:id", verifyToken, categoryControllers.updateCategory);
router.delete("/delete_category/:id", verifyToken, categoryControllers.deleteCategory);

module.exports = router;
