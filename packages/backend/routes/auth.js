import express from "express";
import {
  AUTH_COOKIE_NAME,
  authCookieOptions,
  clearAuthCookieOptions,
  createAuthToken,
} from "../config/auth.js";
import requireAuth from "../middleware/requireAuth.js";
import User from "../models/user.js";

const router = express.Router();

router.post("/signup", async (req, res) => {
  try {
    const email =
      typeof req.body.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    const user = await User.create({
      name: req.body.name || email.split("@")[0] || "GoatTimer User",
      email,
      password: req.body.password,
    });

    res.cookie(AUTH_COOKIE_NAME, createAuthToken(user), authCookieOptions);
    res.status(201).json({ user });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: "Email is already registered" });
    }

    res.status(400).json({ error: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const email =
      typeof req.body.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";
    const user = await User.findOne({ email }).select("+password");
    const passwordMatches = await user?.comparePassword(req.body.password);

    if (!passwordMatches) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (user.password === req.body.password) {
      user.password = await User.hashPassword(req.body.password);
      await user.save();
    }

    res.cookie(AUTH_COOKIE_NAME, createAuthToken(user), authCookieOptions);
    res.json({ user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.auth.email });

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, clearAuthCookieOptions);
  res.json({ message: "Logged out" });
});

export default router;
