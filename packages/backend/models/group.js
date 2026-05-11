import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    // User who created the group
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "owner is required"],
    },

    // Users in the group
    users: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      default: [],
    },

    // Group goal from the written requirement
    groupGoal: {
      type: Number,
      default: 0,
      min: [0, "groupGoal cannot be negative"],
    },

    // Hours from the diagram
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
