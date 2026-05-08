import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "./models/user.js";
dotenv.config();
const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "goattimer-dev-secret";
const JWT_EXPIRES_IN = "7d";
const JWT_COOKIE_NAME = "goattimer_jwt";
const JWT_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const SALT_ROUNDS = 12;

if (!process.env.JWT_SECRET) {
  console.warn("JWT_SECRET is not set. Using a development-only fallback.");
}

function isHashedPassword(password) {
  return typeof password === "string" && /^\$2[aby]\$/.test(password);
}

function formatUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    commitmentLevel: user.commitmentLevel,
    weeklyGoalHours: user.weeklyGoalHours,
  };
}

function createToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );
}

function createAuthResponse(user) {
  return {
    user: formatUser(user),
  };
}

function getJwtCookieOptions() {
  return {
    httpOnly: true,
    maxAge: JWT_COOKIE_MAX_AGE_MS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  };
}

function setAuthCookie(res, token) {
  res.cookie(JWT_COOKIE_NAME, token, getJwtCookieOptions());
}

function clearAuthCookie(res) {
  res.clearCookie(JWT_COOKIE_NAME, {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

function getCookieToken(req) {
  const cookieHeader = req.get("Cookie");

  if (!cookieHeader) {
    return null;
  }

  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${JWT_COOKIE_NAME}=`));

  if (!cookie) {
    return null;
  }

  return decodeURIComponent(cookie.slice(JWT_COOKIE_NAME.length + 1));
}

function authenticateToken(req, res, next) {
  const token = getCookieToken(req);

  if (!token) {
    return res.status(401).json({ error: "Missing auth token" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired auth token" });
  }
}

function requireOwnUser(req, res, next) {
  if (req.userId !== req.params.id) {
    return res.status(403).json({ error: "You can only access your own user" });
  }

  next();
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

// Test server
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from the backend!" });
});

// Create an account and set the JWT cookie
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Name, email, and password are required" });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: await bcrypt.hash(password, SALT_ROUNDS),
    });

    setAuthCookie(res, createToken(user));
    res.status(201).json(createAuthResponse(user));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Log in and set the JWT cookie
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const passwordMatches = isHashedPassword(user.password)
      ? await bcrypt.compare(password, user.password)
      : user.password === password;

    if (!passwordMatches) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (!isHashedPassword(user.password)) {
      user.password = await bcrypt.hash(password, SALT_ROUNDS);
      await user.save();
    }

    setAuthCookie(res, createToken(user));
    res.json(createAuthResponse(user));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify a JWT and return the logged-in user
app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(formatUser(user));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Log out by removing the JWT cookie
app.post("/api/auth/logout", (req, res) => {
  clearAuthCookie(res);
  res.json({ message: "Logged out" });
});

// Get user by ID
app.get(
  "/api/users/:id",
  authenticateToken,
  requireOwnUser,
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json(formatUser(user));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// Update user by ID
app.put(
  "/api/users/:id",
  authenticateToken,
  requireOwnUser,
  async (req, res) => {
    try {
      const update = { ...req.body };

      if (update.email) {
        update.email = update.email.toLowerCase();
      }

      if (update.password) {
        update.password = await bcrypt.hash(update.password, SALT_ROUNDS);
      }

      const user = await User.findByIdAndUpdate(req.params.id, update, {
        new: true,
        runValidators: true,
      });
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json(formatUser(user));
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
);

// Update user commitment level
app.patch(
  "/api/users/:id/commitment",
  authenticateToken,
  requireOwnUser,
  async (req, res) => {
    try {
      const { commitmentLevel } = req.body;
      const levelToHours = { low: 70, medium: 105, hard: 140 };

      if (!commitmentLevel || !levelToHours[commitmentLevel]) {
        return res.status(400).json({
          error: "Invalid commitment level. Use: low, medium, or hard",
        });
      }

      const user = await User.findByIdAndUpdate(
        req.params.id,
        {
          commitmentLevel,
          weeklyGoalHours: levelToHours[commitmentLevel],
        },
        { new: true, runValidators: true },
      );

      if (!user) return res.status(404).json({ error: "User not found" });
      res.json(formatUser(user));
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
);

// Delete user by ID
app.delete(
  "/api/users/:id",
  authenticateToken,
  requireOwnUser,
  async (req, res) => {
    try {
      const user = await User.findByIdAndDelete(req.params.id);
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json({ message: "User deleted" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// Start the server
const PORT = process.env.PORT || 5050;
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
