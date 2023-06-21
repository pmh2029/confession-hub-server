const express = require("express");
const router = express.Router();
const categoryControllers = require("../controllers/categoryControllers");
const { verifyToken, optionallyVerifyToken } = require("../middleware/auth");

router.get("/", categoryControllers.getAllCategories);
router.get("/:id", optionallyVerifyToken, categoryControllers.getCategory);

module.exports = router;
