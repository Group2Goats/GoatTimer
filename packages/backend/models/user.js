import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;
const BCRYPT_HASH_PATTERN = /^\$2[aby]\$\d{2}\$/;

function isPasswordHash(password) {
  return typeof password === "string" && BCRYPT_HASH_PATTERN.test(password);
}

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
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

userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password") || isPasswordHash(this.password)) {
    return;
  }

  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});

userSchema.methods.comparePassword = async function comparePassword(password) {
  if (!password || !this.password) return false;

  if (isPasswordHash(this.password)) {
    return bcrypt.compare(password, this.password);
  }

  return this.password === password;
};

userSchema.methods.hasPlaintextPassword = function hasPlaintextPassword() {
  return !isPasswordHash(this.password);
};

userSchema.statics.hashPassword = function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
};

const User = mongoose.model("User", userSchema);

export default User;
