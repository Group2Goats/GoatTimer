import express from "express";
import mongoose from "mongoose";

import Group from "../models/group.js";
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
  return user?._id?.toString?.() || String(user?._id || "");
}

export function mapUsersToLeaderboardEntries(users, currentUserId) {
  return users.map((user, index) => {
    const userId = getUserId(user);

    return {
      rank: index + 1,
      userId,
      name: user.name || user.email || "GoatTimer User",
      weeklyHours: user.weeklyHours || 0,
      isCurrentUser: userId === currentUserId,
    };
  });
}

export function createLeaderboardHandler({
  UserModel = User,
  GroupModel = Group,
} = {}) {
  return async function leaderboardHandler(req, res) {
    try {
      const scope = req.query.scope === "group" ? "group" : "global";
      const limit = getLeaderboardLimit(req.query.limit);
      const currentUserId = req.auth?.userId;

      if (!currentUserId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      if (scope === "global") {
        const users = await UserModel.find()
          .sort({ weeklyHours: -1, name: 1 })
          .limit(limit)
          .select("name email weeklyHours")
          .lean();

        return res.json({
          scope,
          entries: mapUsersToLeaderboardEntries(users, currentUserId),
        });
      }

      const groupId =
        typeof req.query.groupId === "string" ? req.query.groupId : "";

      if (!mongoose.Types.ObjectId.isValid(groupId)) {
        return res.status(400).json({ error: "Valid groupId is required" });
      }

      const group = await GroupModel.findById(groupId)
        .populate("users", "name email weeklyHours")
        .lean();

      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }

      const memberIds = group.users.map((user) => getUserId(user));

      if (!memberIds.includes(currentUserId)) {
        return res
          .status(403)
          .json({ error: "You are not a member of this group" });
      }

      const users = [...group.users]
        .sort((first, second) => {
          const hoursDifference =
            (second.weeklyHours || 0) - (first.weeklyHours || 0);

          if (hoursDifference !== 0) {
            return hoursDifference;
          }

          return (first.name || first.email || "").localeCompare(
            second.name || second.email || "",
          );
        })
        .slice(0, limit);

      return res.json({
        scope,
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
