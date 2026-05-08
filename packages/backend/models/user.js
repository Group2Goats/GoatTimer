import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    firstName: {
      type: String,
      required: [true, "first name is required"],
      trim: true,
    },

    isAdmin: {
      type: Boolean,
      default: false,
    },

    totalHours: {
      type: Number,
      default: 0,
      min: [0, "totalHours cannot be negative"],
    },

    goal: {
      type: Number,
      default: 0,
      min: [0, "goal cannot be negative"],
    },

    weeklyHours: {
      type: Number,
      default: 0,
      min: [0, "weeklyHours cannot be negative"],
    },

    age: {
      type: Number,
      min: [0, "age cannot be negative"],
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("User", userSchema);

export default User;
