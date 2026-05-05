import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    commitmentLevel: {
      type: String,
      enum: ["low", "medium", "hard"],
      default: null,
    },
    weeklyGoalHours: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("User", userSchema);

export default User;
