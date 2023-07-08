const Notification = require("../models/Notification");

const getNotifications = async (req, res) => {
  try {
    const userId = req.params.id;

    const notificationsQuery = Notification.find({
      owner: userId,
      userId: { $ne: userId },
      read: false,
    }).sort({ createdAt: -1 });

    const countQuery = Notification.countDocuments({
      userId: { $ne: userId },
      owner: userId,
      read: false,
    });

    const [notifications, totalNotifications] = await Promise.all([
      notificationsQuery,
      countQuery,
    ]);

    res.status(200).json({
      notifications,
      totalNotifications,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateNotification = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    notification.read = true;
    await notification.save();
    res.status(200).json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateNotifications = async (req, res) => {
  try {
    const notifications = req.body.notifications;
    if (!Array.isArray(notifications)) {
      return res
        .status(400)
        .json({ error: "Invalid input. 'notifications' must be an array." });
    }

    await Promise.all(
      notifications.map(async (notificationId) => {
        const notification = await Notification.findById(notificationId);

        if (!notification) {
          return res
            .status(404)
            .json({ error: `Notification ${notificationId} not found` });
        }

        notification.read = true;
        await notification.save();
      })
    );

    res.status(200).json({ message: "Notifications updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getNotifications, updateNotification, updateNotifications };
