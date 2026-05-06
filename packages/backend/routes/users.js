import express from "express";
import requireAuth from "../middleware/requireAuth.js";
import User from "../models/user.js";

const router = express.Router();
const COMMITMENT_LEVEL_TO_HOURS = { low: 70, medium: 105, hard: 140 };

// Collect user data
router.get("/", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new user
router.post("/", async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get user by ID
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user by ID
router.put("/:id", async (req, res) => {
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
router.patch("/me/commitment", requireAuth, async (req, res) => {
  try {
    const weeklyGoalHours = COMMITMENT_LEVEL_TO_HOURS[req.body.commitmentLevel];

    if (!weeklyGoalHours) {
      return res
        .status(400)
        .json({ error: "Invalid commitment level. Use: low, medium, or hard" });
    }

    const user = await User.findOneAndUpdate(
      { email: req.auth.email },
      { commitmentLevel: req.body.commitmentLevel, weeklyGoalHours },
      { new: true, runValidators: true },
    );

    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update user commitment level
router.patch("/:id/commitment", requireAuth, async (req, res) => {
  try {
    const weeklyGoalHours = COMMITMENT_LEVEL_TO_HOURS[req.body.commitmentLevel];

    if (!weeklyGoalHours) {
      return res
        .status(400)
        .json({ error: "Invalid commitment level. Use: low, medium, or hard" });
    }

    const user = await User.findOneAndUpdate(
      { _id: req.params.id, email: req.auth.email },
      { commitmentLevel: req.body.commitmentLevel, weeklyGoalHours },
      { new: true, runValidators: true },
    );

    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete user by ID
router.delete("/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
