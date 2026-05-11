import express from "express";
import requireAuth from "../middleware/requireAuth.js";
import User from "../models/user.js";

const router = express.Router();
const COMMITMENT_LEVEL_TO_HOURS = { low: 70, medium: 105, hard: 140 };

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

export default router;
