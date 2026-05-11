import mongoose from "mongoose";

const dayNames = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const scheduleSchema = new mongoose.Schema(
  {
    days: {
      type: [
        {
          type: String,
          enum: dayNames,
          lowercase: true,
          trim: true,
        },
      ],
      default: [],
    },

    startTime: {
      type: String,
      default: "",
      trim: true,
    },

    endTime: {
      type: String,
      default: "",
      trim: true,
    },

    timezone: {
      type: String,
      default: "UTC",
      trim: true,
    },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    // Groups that the user belongs to
    groups: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Group",
        },
      ],
      default: [],
    },

    email: {
      type: String,
      required: [true, "email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    name: {
      type: String,
      required: [true, "name is required"],
      trim: true,
    },

    // From the diagram
    firstName: {
      type: String,
      default: "",
      trim: true,
    },

    isAdmin: {
      type: Boolean,
      default: false,
    },

    goal: {
      type: Number,
      default: 0,
      min: [0, "goal cannot be negative"],
    },

    schedule: {
      type: scheduleSchema,
      default: () => ({}),
    },

    totalHours: {
      type: Number,
      default: 0,
      min: [0, "totalHours cannot be negative"],
    },

    weeklyHours: {
      type: Number,
      default: 0,
      min: [0, "weeklyHours cannot be negative"],
    },

    todayHours: {
      type: Number,
      default: 0,
      min: [0, "todayHours cannot be negative"],
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
