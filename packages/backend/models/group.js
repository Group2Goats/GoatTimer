import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    // The user who owns the group
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "owner is required"],
    },

    // The users inside the group
    users: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      default: [],
    },

    // The group goal
    goal: {
      type: Number,
      default: 0,
      min: [0, "goal cannot be negative"],
    },

    // The group hours
    hours: {
      type: Number,
      default: 0,
      min: [0, "hours cannot be negative"],
    },
  },
  {
    timestamps: true,
  },
);

const Group = mongoose.model("Group", groupSchema);

export default Group;
