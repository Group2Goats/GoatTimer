//loads global or group leaderboard data and returns ranked users with the current user marked
import mongoose from "mongoose";

import User from "../models/user.js";
import Group from "../models/group.js";

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 50;

//parse and cap leaderboard limit
export function getLeaderboardLimit(rawLimit) {
  const parsedLimit = Number.parseInt(rawLimit, 10);

  if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) {
    return DEFAULT_LIMIT;
  }

  return Math.min(parsedLimit, MAX_LIMIT);
}
//gets user id as a string from either a user object or raw id
function getUserId(user) {
  return user?._id?.toString?.() || user?.toString?.() || String(user || "");
}
//converts users into ranked leaderboard entries and marks the current user
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

export async function leaderboardHandler(req, res) {
  try {
    const limit = getLeaderboardLimit(req.query.limit);
    const scope = req.query.scope || "global";
    const groupId = req.query.groupId;
    const currentUserId = req.auth?.userId;

    if (!currentUserId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    let users;

    if (scope === "group" && groupId) {
      // Validate groupId format
      if (!mongoose.Types.ObjectId.isValid(groupId)) {
        return res.status(400).json({ error: "Invalid group ID" });
      }

      // Fetch the group and get its users
      const group = await Group.findById(groupId)
        .populate({
          path: "users",
          select: "name email totalHours",
          options: { sort: { totalHours: -1, name: 1 }, limit },
        })
        .lean();

      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }

      users = group.users || [];
    } else {
      // Global leaderboard
      users = await User.find()
        .sort({ totalHours: -1, name: 1 })
        .limit(limit)
        .select("name email totalHours")
        .lean();
    }

    return res.json({
      scope,
      entries: mapUsersToLeaderboardEntries(users, currentUserId),
    });
  } catch (error) {
    return res.status(500).json({
      error: error?.message || "Could not load leaderboard",
    });
  }
}
