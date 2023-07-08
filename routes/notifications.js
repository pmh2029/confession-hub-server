const express = require("express");
const router = express.Router();
const notificationControllers = require("../controllers/notificationControllers");
const { verifyToken } = require("../middleware/auth");

router.get("/:id", verifyToken, notificationControllers.getNotifications);
router.patch("/:id", verifyToken, notificationControllers.updateNotification);
router.post("/", verifyToken, notificationControllers.updateNotifications)

module.exports = router;
