import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import User from "./models/user.js";
dotenv.config();
const app = express();
app.use(express.json());
app.use(cookieParser());

const AUTH_COOKIE_NAME = "goatTimerAuth";
const JWT_EXPIRES_IN = "7d";
const ONE_WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;
const COMMITMENT_LEVEL_TO_HOURS = { low: 70, medium: 105, hard: 140 };

const authCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: ONE_WEEK_IN_MS,
};

const clearAuthCookieOptions = {
  httpOnly: authCookieOptions.httpOnly,
  sameSite: authCookieOptions.sameSite,
  secure: authCookieOptions.secure,
  path: authCookieOptions.path,
};

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required for authentication");
  }

  return process.env.JWT_SECRET;
}

function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function getDefaultName(email) {
  return email.split("@")[0] || "GoatTimer User";
}

function createAuthToken(user) {
  return jwt.sign({ userId: user.email }, getJwtSecret(), {
    expiresIn: JWT_EXPIRES_IN,
  });
}

function setAuthCookie(res, user) {
  res.cookie(AUTH_COOKIE_NAME, createAuthToken(user), authCookieOptions);
}

function isAuthConfigError(error) {
  return error.message === "JWT_SECRET is required for authentication";
}

function isDuplicateEmailError(error) {
  return error.code === 11000;
}

function getCommitmentUpdate(commitmentLevel) {
  const weeklyGoalHours = COMMITMENT_LEVEL_TO_HOURS[commitmentLevel];

  if (!weeklyGoalHours) {
    return null;
  }

  return { commitmentLevel, weeklyGoalHours };
}

function getAuthEmailFromPayload(payload) {
  const email = payload.userId || payload.sub;

  return typeof email === "string" ? normalizeEmail(email) : "";
}

function requireAuth(req, res, next) {
  const token = req.cookies[AUTH_COOKIE_NAME];

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const payload = jwt.verify(token, getJwtSecret());
    const email = getAuthEmailFromPayload(payload);

    if (!email) {
      return res.status(401).json({ error: "Invalid or expired session" });
    }

    req.auth = { email };
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired session" });
  }
}

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to database successfully");
  } catch (error) {
    console.error("Connected to database failed:", error.message);
    process.exit(1);
  }
}
connectDB();

// Test server
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from the backend!" });
});

// Create a new account and start an authenticated session
app.post("/api/auth/signup", async (req, res) => {
  try {
    getJwtSecret();

    const email = normalizeEmail(req.body.email);
    const user = await User.create({
      name: req.body.name || getDefaultName(email),
      email,
      password: req.body.password,
    });

    setAuthCookie(res, user);
    res.status(201).json({ user });
  } catch (error) {
    if (isAuthConfigError(error)) {
      return res.status(500).json({ error: error.message });
    }

    if (isDuplicateEmailError(error)) {
      return res.status(409).json({ error: "Email is already registered" });
    }

    res.status(400).json({ error: error.message });
  }
});

// Authenticate an existing account and lazily hash old plaintext passwords
app.post("/api/auth/login", async (req, res) => {
  try {
    getJwtSecret();

    const email = normalizeEmail(req.body.email);
    const user = await User.findOne({ email }).select("+password");
    const passwordMatches = await user?.comparePassword(req.body.password);

    if (!passwordMatches) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (user.hasPlaintextPassword()) {
      user.password = await User.hashPassword(req.body.password);
      await user.save();
    }

    setAuthCookie(res, user);
    res.json({ user });
  } catch (error) {
    if (isAuthConfigError(error)) {
      return res.status(500).json({ error: error.message });
    }

    res.status(400).json({ error: error.message });
  }
});

// End the authenticated session
app.post("/api/auth/logout", (req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, clearAuthCookieOptions);
  res.json({ message: "Logged out" });
});

// Collect user data
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new user
app.post("/api/users", async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get user by ID
app.get("/api/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user by ID
app.put("/api/users/:id", async (req, res) => {
  try {
    const updates = { ...req.body };

    if (Object.prototype.hasOwnProperty.call(updates, "password")) {
      updates.password = await User.hashPassword(updates.password);
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update the authenticated user's commitment level
app.patch("/api/users/me/commitment", requireAuth, async (req, res) => {
  try {
    const update = getCommitmentUpdate(req.body.commitmentLevel);

    if (!update) {
      return res
        .status(400)
        .json({ error: "Invalid commitment level. Use: low, medium, or hard" });
    }

    const user = await User.findOneAndUpdate(
      { email: req.auth.email },
      update,
      { new: true, runValidators: true },
    );

    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update user commitment level
app.patch("/api/users/:id/commitment", requireAuth, async (req, res) => {
  try {
    const update = getCommitmentUpdate(req.body.commitmentLevel);

    if (!update) {
      return res
        .status(400)
        .json({ error: "Invalid commitment level. Use: low, medium, or hard" });
    }

    const user = await User.findOneAndUpdate(
      { _id: req.params.id, email: req.auth.email },
      update,
      { new: true, runValidators: true },
    );

    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete user by ID
app.delete("/api/users/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
