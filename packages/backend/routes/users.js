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
  "totalHours",
  "weeklyHours",
  "todayHours",
  "interests",
  "isProfilePublic",
  "profileVisibility",
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

//get public profile for one user
router.get("/:userParam/public", requireAuth, async (req, res) => {
  try {
    const user = await User.findOne(getUserFilter(req.params.userParam)).select(
      "name age interests isProfilePublic totalHours",
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({
      user: {
        _id: user._id,
        name: user.name,
        totalHours: user.totalHours || 0,
        isProfilePublic: user.isProfilePublic,
        age: user.isProfilePublic ? user.age || null : null,
        interests: user.isProfilePublic ? user.interests || "" : "",
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
router.put("/:userParam", async (req, res) => {
  try {
    const updates = getAllowedUpdates(req.body, allowedUserUpdateFields);

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: `At least one valid field is required: ${allowedUserUpdateFields.join(", ")}`,
      });
    }

    const user = await User.findOneAndUpdate(
      getUserFilter(req.params.userParam),
      updates,
      {
        new: true,
        runValidators: true,
      },
    ).populate("groups");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json(user);
  } catch (error) {
    return sendError(res, error, 400);
  }
});

export default router;
