//handles user routes for commitments, study time, lookup, groups, and profile updates.
import express from "express";
import mongoose from "mongoose";

import User from "../models/user.js";
import Group from "../models/group.js";
import requireAuth from "../middleware/requireAuth.js";

const router = express.Router();

//user fields
const allowedUserUpdateFields = [
  "email",
  "name",
  "firstName",
  "goal",
  "schedule",
  "commitmentLevel",
  "age",
  "interests",
  "profileVisibility",
  "featureSettings",
  "totalHours",
  "weeklyHours",
  "todayHours",
];

const commitmentGoals = {
  low: 20,
  medium: 40,
  hard: 60,
};

//keeps only the request body fields that are allowed to be updated
function getAllowedUpdates(body, allowedFields) {
  return Object.fromEntries(
    Object.entries(body).filter(([key]) => allowedFields.includes(key)),
  );
}

export function normalizeUserName(name) {
  if (typeof name !== "string") {
    return { error: "Username is required" };
  }

  const value = name.trim();

  if (!value) {
    return { error: "Username is required" };
  }

  return { value };
}

//check if email exists
function isDuplicateKeyError(error) {
  return error?.code === 11000;
}

function getDuplicateKeyMessage(error) {
  const field = Object.keys(error.keyPattern ?? {})[0] ?? "field";
  return `${field} already exists`;
}

//send err to frontend
function sendError(res, error, defaultStatus = 500) {
  if (isDuplicateKeyError(error)) {
    return res.status(409).json({ error: getDuplicateKeyMessage(error) });
  }

  if (error?.name === "ValidationError" || error?.name === "CastError") {
    return res.status(400).json({ error: error.message });
  }

  return res.status(defaultStatus).json({
    error: error?.message || "Something went wrong",
  });
}

//find user by id or email
function getUserFilter(userParam) {
  const value = userParam.trim().toLowerCase();

  if (mongoose.Types.ObjectId.isValid(value)) {
    return { _id: value };
  }

  return { email: value };
}

//update current user's commitment
router.patch("/me/commitment", requireAuth, async (req, res) => {
  try {
    const { commitmentLevel } = req.body;

    if (!Object.hasOwn(commitmentGoals, commitmentLevel)) {
      return res.status(400).json({
        error: "commitmentLevel must be low, medium, or hard",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.auth.userId,
      {
        commitmentLevel,
        goal: commitmentGoals[commitmentLevel],
      },
      {
        new: true,
        runValidators: true,
      },
    ).populate("groups");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ user });
  } catch (error) {
    return sendError(res, error, 400);
  }
});

//update study time after a session
router.patch("/:userParam/study-time", async (req, res) => {
  try {
    const { hours } = req.body;

    if (typeof hours !== "number" || hours <= 0) {
      return res.status(400).json({ error: "hours must be a positive number" });
    }

    const user = await User.findOneAndUpdate(
      getUserFilter(req.params.userParam),
      {
        $inc: {
          totalHours: hours,
          weeklyHours: hours,
          todayHours: hours,
        },
      },
      { new: true, runValidators: true },
    ).populate("groups");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json(user);
  } catch (error) {
    return sendError(res, error, 400);
  }
});

//get all users
router.get("/", async (req, res) => {
  try {
    const users = await User.find().populate("groups").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    sendError(res, error);
  }
});

//get all groups for one user
router.get("/:userParam/groups", async (req, res) => {
  try {
    const user = await User.findOne(getUserFilter(req.params.userParam));

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const groups = await Group.find({
      $or: [{ owner: user._id }, { users: user._id }],
    })
      .populate("owner")
      .populate("users")
      .sort({ createdAt: -1 });

    return res.json(groups);
  } catch (error) {
    return sendError(res, error);
  }
});

//get profile viewer data for one user
router.get("/:userParam/public", requireAuth, async (req, res) => {
  try {
    const profileUser = await User.findOne(
      getUserFilter(req.params.userParam),
    ).select("name age interests profileVisibility totalHours groups");

    if (!profileUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const viewer = await User.findById(req.auth.userId).select("groups");

    const visibility = profileUser.profileVisibility || "private";
    const isSelf = profileUser._id.toString() === req.auth.userId;

    const viewerGroups = new Set((viewer?.groups || []).map(String));
    const profileUserGroups = (profileUser.groups || []).map(String);

    const sharesGroup = profileUserGroups.some((groupId) =>
      viewerGroups.has(groupId),
    );

    const canViewDetails =
      isSelf ||
      visibility === "public" ||
      (visibility === "groups" && sharesGroup);

    return res.json({
      user: {
        _id: profileUser._id,
        name: profileUser.name,
        totalHours: profileUser.totalHours || 0,
        profileVisibility: visibility,
        age: canViewDetails ? profileUser.age || null : null,
        interests: canViewDetails ? profileUser.interests || [] : [],
      },
    });
  } catch (error) {
    return sendError(res, error);
  }
});

//get one user by id or email
router.get("/:userParam", async (req, res) => {
  try {
    const user = await User.findOne(
      getUserFilter(req.params.userParam),
    ).populate("groups");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json(user);
  } catch (error) {
    return sendError(res, error);
  }
});

//update user by id or email
router.put("/:userParam", requireAuth, async (req, res) => {
  try {
    const filter = getUserFilter(req.params.userParam);
    const targetUser = await User.findOne(filter).select("_id");

    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (targetUser._id.toString() !== req.auth.userId) {
      return res.status(403).json({ error: "You can only update yourself" });
    }

    const updates = getAllowedUpdates(req.body, allowedUserUpdateFields);

    if (Object.hasOwn(updates, "name")) {
      const normalizedName = normalizeUserName(updates.name);

      if (normalizedName.error) {
        return res.status(400).json({ error: normalizedName.error });
      }

      updates.name = normalizedName.value;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: `At least one valid field is required: ${allowedUserUpdateFields.join(", ")}`,
      });
    }

    const user = await User.findByIdAndUpdate(targetUser._id, updates, {
      new: true,
      runValidators: true,
    }).populate("groups");

    return res.json(user);
  } catch (error) {
    return sendError(res, error, 400);
  }
});

export default router;
