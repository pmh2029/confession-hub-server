const express = require("express");
const router = express.Router();
const categoryControllers = require("../controllers/categoryControllers");
const { verifyToken } = require("../middleware/auth");

router.get("/", verifyToken, categoryControllers.getAllCategories);
router.get("/:id", verifyToken, categoryControllers.getCategory);
router.post("/", verifyToken, categoryControllers.createCategory);
router.patch("/:id", verifyToken, categoryControllers.updateCategory);
router.delete("/:id", verifyToken, categoryControllers.deleteCategory);

module.exports = router;
