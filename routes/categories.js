const express = require("express");
const router = express.Router();
const categoryControllers = require("../controllers/categoryControllers");
const { verifyToken, optionallyVerifyToken } = require("../middleware/auth");

router.get("/", categoryControllers.getAllCategories);
router.get("/:id", optionallyVerifyToken, categoryControllers.getCategory);
router.post("/", verifyToken, categoryControllers.createCategory);
router.patch("/:id", verifyToken, categoryControllers.updateCategory);
router.delete("/:id", verifyToken, categoryControllers.deleteCategory);

module.exports = router;
