//handles signup, login, current-user lookup, and logout using JWT
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
const DUPLICATE_KEY_ERROR_CODE = 11000;
const DUPLICATE_EMAIL_MESSAGE = "Email is already registered";

function isDuplicateEmailError(error) {
  const message = typeof error?.message === "string" ? error.message : "";
  const duplicateError =
    error?.code === DUPLICATE_KEY_ERROR_CODE ? error : error?.cause;

  if (message.includes("E11000") && message.includes("email_1")) {
    return true;
  }

  if (!duplicateError || duplicateError.code !== DUPLICATE_KEY_ERROR_CODE) {
    return false;
  }

  const hasEmailKey =
    !duplicateError.keyPattern ||
    duplicateError.keyPattern.email ||
    duplicateError.keyValue?.email ||
    duplicateError.message?.includes("email_1");

  return Boolean(hasEmailKey);
}
//creates a new user, prevents duplicate emails, set JWT cookie, and return user
router.post("/signup", async (req, res) => {
  try {
    const email =
      typeof req.body.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const existingUser = await User.exists({ email });

    if (existingUser) {
      return res.status(409).json({ error: DUPLICATE_EMAIL_MESSAGE });
    }

    const user = await User.create({
      name: name || email.split("@")[0] || "GoatTimer User",
      email,
      password: req.body.password,
    });

    const token = createAuthToken(user);
    res.cookie(AUTH_COOKIE_NAME, token, authCookieOptions);
    res.status(201).json({ user });
  } catch (error) {
    if (isDuplicateEmailError(error)) {
      return res.status(409).json({ error: DUPLICATE_EMAIL_MESSAGE });
    }

    res.status(400).json({ error: error.message });
  }
});
//logs in an existing user, upgrades plain-text password if needed, set JWT cookie, and return user
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

    const token = createAuthToken(user);
    res.cookie(AUTH_COOKIE_NAME, token, authCookieOptions);
    res.json({ user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
//return currently logged-in user using verified JWT data from requireAuth
router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.auth.email });

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
//clears auth cookie to log the user out
router.post("/logout", (req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, clearAuthCookieOptions);
  res.json({ message: "Logged out" });
});

export default router;
