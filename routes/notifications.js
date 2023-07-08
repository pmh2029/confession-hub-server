const express = require("express");
const router = express.Router();
const notificationControllers = require("../controllers/notificationControllers");
const { verifyToken } = require("../middleware/auth");

router.get("/:id", verifyToken, notificationControllers.getNotifications);

module.exports = router;
