const Notification = require("../models/Notification");

const getNotifications = async (req, res) => {
  try {
    const userId = req.params.id;
    const page = parseInt(req.query.page) || 1; // Lấy tham số "page" từ query string, mặc định là 1 nếu không được chỉ định
    const limit = parseInt(req.query.limit) || 10; // Lấy tham số "limit" từ query string, mặc định là 10 nếu không được chỉ định

    const skip = (page - 1) * limit; // Số bản ghi bỏ qua

    const notificationsQuery = Notification.find({
      owner: userId,
      userId: { $ne: userId },
      read: false,
    });

    const countQuery = Notification.countDocuments({
      userId: { $ne: userId },
      owner: userId,
      read: false,
    });

    const [notifications, totalNotifications] = await Promise.all([
      notificationsQuery.skip(skip).limit(limit),
      countQuery,
    ]);

    const totalPages = Math.ceil(totalNotifications / limit); // Tính tổng số trang

    res.status(200).json({
      notifications,
      currentPage: page,
      totalPages,
      totalNotifications,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getNotifications };
