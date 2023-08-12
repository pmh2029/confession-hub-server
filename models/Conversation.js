const mongoose = require("mongoose");
const Message = require("./Message");

const ConversationSchema = new mongoose.Schema(
  {
    recipients: [
      {
        type: mongoose.Types.ObjectId,
        ref: "user",
      },
    ],
    lastMessageAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("conversation", ConversationSchema);

// ConversationSchema.pre("deleteOne", { document: true }, async function (next) {
//   const conversationID = this._id;
//   try {
//     // Delete messages associated with the conversation
//     await Message.deleteMany({ conversation: conversationID });

//     next();
//   } catch (error) {
//     next(error);
//   }
// });
