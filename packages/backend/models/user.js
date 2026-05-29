//schema for users: auth fields, study goals, schedule, hours, password hashing
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;
const BCRYPT_HASH_PATTERN = /^\$2[aby]\$\d{2}\$/;

//checks whether a password value is already a bcrypt hash
function isPasswordHash(password) {
  return typeof password === "string" && BCRYPT_HASH_PATTERN.test(password);
}

const dayNames = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];
//user's weekly availability, including days, start time, end time, and timezone
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

//user model fields, ensure password not present when returning data
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

    password: {
      type: String,
      required: [true, "password is required"],
      select: false,
    },

    commitmentLevel: {
      type: String,
      enum: ["low", "medium", "hard"],
      default: null,
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

    interests: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: [24, "Each interest must be 24 characters or less"],
          match: [
            /^[a-zA-Z0-9 '&-]+$/,
            "Interests can only contain letters, numbers, spaces, apostrophes, ampersands, and hyphens",
          ],
        },
      ],
      default: [],
      validate: {
        validator: (interests) => interests.length <= 10,
        message: "You can only add up to 10 interests",
      },
    },

    profileVisibility: {
      type: String,
      enum: ["public", "groups", "private"],
      default: "private",
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.password;
        return ret;
      },
    },
    toObject: {
      transform: (_doc, ret) => {
        delete ret.password;
        return ret;
      },
    },
  },
);

//hashes password before saving a user, unless it is unchanged or already hashed
userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password") || isPasswordHash(this.password)) {
    return;
  }

  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});

//checks if plain password matches the user's hashed password
userSchema.methods.comparePassword = async function comparePassword(password) {
  if (!password || !this.password) {
    return false;
  }

  return bcrypt.compare(password, this.password);
};

//hashes password so it can be reused outside the save hook
userSchema.statics.hashPassword = function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
};

const User = mongoose.model("User", userSchema);

export default User;
