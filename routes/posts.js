const express = require("express");
const router = express.Router();
const postControllers = require("../controllers/postControllers");
const { verifyToken, optionallyVerifyToken } = require("../middleware/auth");

router.get("/", optionallyVerifyToken, postControllers.getAllPosts);
router.post("/", postControllers.createPost);

router.get("/:id", optionallyVerifyToken, postControllers.getPost);
router.patch("/:id", verifyToken, postControllers.updatePost);
router.delete("/:id", verifyToken, postControllers.deletePost);

router.post("/upvote/:id", verifyToken, postControllers.upvotePost);
router.delete("/upvote/:id", verifyToken, postControllers.unUpvotePost);
router.post("/downvote/:id", verifyToken, postControllers.downvotePost);
router.delete("/downvote/:id", verifyToken, postControllers.unDownvotePost);
router.post("/report/:id", verifyToken, postControllers.reportPost);
router.delete("/report/:id", verifyToken, postControllers.unReportPost);

router.get(
  "/upvoted/:id",
  optionallyVerifyToken,
  postControllers.getUserUpvotedPosts
);

module.exports = router;
