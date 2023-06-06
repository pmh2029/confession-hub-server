const express = require("express");
const router = express.Router();
const messageControllers = require("../controllers/messageControllers");
const { verifyToken } = require("../middleware/auth");

router.get("/", verifyToken, messageControllers.getConversations);
router.post("/:id", verifyToken, messageControllers.sendMessage);
router.get("/:id", verifyToken, messageControllers.getMessages);

module.exports = router;
