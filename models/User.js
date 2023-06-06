const mongoose = require("mongoose");
const { isEmail, contains } = require("validator");
const filter = require("../utils/filter");

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      minlength: [6, "Must be at least 6 characters long"],
      maxlength: [30, "Must be no more than 30 characters long"],
      validate: {
        validator: (val) => !contains(val, " "),
        message: "Must contain no spaces",
      },
    },
    email: {
      type: String,
      required: true,
      unique: true,
      validate: [isEmail, "Must be a valid email address"],
    },
    password: {
      type: String,
      required: true,
      minLength: [8, "Must be at least 8 characters long"],
    },
    status: {
      type: String,
      default: "",
      maxLength: [50, "Must be at most 50 characters long"],
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

UserSchema.pre("save", function (next) {
  if (filter.isProfane(this.username)) {
    throw new Error("Invalid username");
  }

  if (this.status.length > 0) {
    this.status = filter.clean(this.status);
  }

  next();
});

module.exports = mongoose.model("user", UserSchema);
