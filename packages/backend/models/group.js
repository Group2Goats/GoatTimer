import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    // Group name
    name: {
      type: String,
      default: "Untitled Group",
      trim: true,
    },

    // User who created the group
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "owner is required"],
    },

    //users in the group
    users: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      default: [],
    },

    //group goal
    groupGoal: {
      type: Number,
      default: 0,
      min: [0, "groupGoal cannot be negative"],
    },

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
