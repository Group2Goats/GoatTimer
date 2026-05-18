import express from "express";

import User from "../models/user.js";
import requireAuth from "../middleware/requireAuth.js";

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 50;

const router = express.Router();

export function getLeaderboardLimit(rawLimit) {
  const parsedLimit = Number.parseInt(rawLimit, 10);

  if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) {
    return DEFAULT_LIMIT;
  }

  return Math.min(parsedLimit, MAX_LIMIT);
}

function getUserId(user) {
  return user?._id?.toString?.() || user?.toString?.() || String(user || "");
}

export function mapUsersToLeaderboardEntries(users, currentUserId) {
  return users.map((user, index) => {
    const userId = getUserId(user);

    return {
      rank: index + 1,
      userId,
      name: user.name || user.email || "GoatTimer User",
      totalHours: user.totalHours || 0,
      isCurrentUser: userId === currentUserId,
    };
  });
}

export function createLeaderboardHandler({ UserModel = User } = {}) {
  return async function leaderboardHandler(req, res) {
    try {
      const limit = getLeaderboardLimit(req.query.limit);
      const currentUserId = req.auth?.userId;

      if (!currentUserId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const users = await UserModel.find()
        .sort({ totalHours: -1, name: 1 })
        .limit(limit)
        .select("name email totalHours")
        .lean();

      return res.json({
        scope: "global",
        entries: mapUsersToLeaderboardEntries(users, currentUserId),
      });
    } catch (error) {
      return res.status(500).json({
        error: error?.message || "Could not load leaderboard",
      });
    }
  };
}

router.get("/", requireAuth, createLeaderboardHandler());

export default router;
