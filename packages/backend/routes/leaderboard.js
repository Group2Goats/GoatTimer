//loads global or group leaderboard data and returns ranked users with the current user marked
import mongoose from "mongoose";

import User from "../models/user.js";
import Group from "../models/group.js";

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 50;

//parses and caps leaderboard limit, falling back to default if invalid
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
      if (!mongoose.Types.ObjectId.isValid(groupId)) {
        return res.status(400).json({ error: "Invalid group ID" });
      }

      const group = await Group.findById(groupId)
        .populate({
          path: "users",
          match: { profileVisibility: { $in: ["public", "groups"] } },
          select: "name email totalHours profileVisibility",
          options: { sort: { totalHours: -1, name: 1 }, limit },
        })
        .lean();

      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }

      users = group.users || [];
    } else {
      //global leaderboard only shows public users
      users = await User.find({
        profileVisibility: "public",
      })
        .sort({ totalHours: -1, name: 1 })
        .limit(limit)
        .select("name email totalHours profileVisibility")
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
