import express from "express";
import mongoose from "mongoose";

import User from "../models/user.js";
import Group from "../models/group.js";
import requireAuth from "../middleware/requireAuth.js";

const router = express.Router();

//group fields
const allowedGroupUpdateFields = ["name", "groupGoal", "hours"];

function getAllowedUpdates(body, allowedFields) {
  return Object.fromEntries(
    Object.entries(body).filter(([key]) => allowedFields.includes(key)),
  );
}

//send err to frontend
function sendError(res, error, defaultStatus = 500) {
  if (error?.name === "ValidationError" || error?.name === "CastError") {
    return res.status(400).json({ error: error.message });
  }

  return res.status(defaultStatus).json({
    error: error?.message || "Something went wrong",
  });
}

//ensure user is array
function getUsersArray(users) {
  if (Array.isArray(users)) {
    return users;
  }

  if (!users) {
    return [];
  }

  return [users];
}

//get all groups
router.get("/", async (req, res) => {
  try {
    const groups = await Group.find()
      .populate("owner")
      .populate("users")
      .sort({ createdAt: -1 });

    res.json(groups);
  } catch (error) {
    sendError(res, error);
  }
});

//create group
router.post("/", requireAuth, async (req, res) => {
  try {
    const owner = req.auth.userId;
    const { name = "Untitled Group", groupGoal = 0, hours = 0 } = req.body;
    const users = getUsersArray(req.body.users);

    const ownerUser = await User.findById(owner);

    if (!ownerUser) {
      return res.status(404).json({ error: "Owner user not found" });
    }

    const groupUsers = [...new Set([owner, ...users].map(String))];

    const group = await Group.create({
      name,
      owner,
      users: groupUsers,
      groupGoal,
      hours,
    });

    await User.updateMany(
      { _id: { $in: groupUsers } },
      { $addToSet: { groups: group._id } },
    );

    const populatedGroup = await Group.findById(group._id)
      .populate("owner")
      .populate("users");

    return res.status(201).json(populatedGroup);
  } catch (error) {
    return sendError(res, error, 400);
  }
});

//get one by id
router.get("/:groupParam", async (req, res) => {
  try {
    const { groupParam } = req.params;

    if (!mongoose.Types.ObjectId.isValid(groupParam)) {
      return res.status(400).json({ error: "Invalid group id" });
    }

    const group = await Group.findById(groupParam)
      .populate("owner")
      .populate("users");

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    return res.json(group);
  } catch (error) {
    return sendError(res, error);
  }
});

//group
router.put("/:groupParam", async (req, res) => {
  try {
    const { groupParam } = req.params;
    const addUsers = getUsersArray(req.body.addUsers);
    const removeUsers = getUsersArray(req.body.removeUsers);

    if (!mongoose.Types.ObjectId.isValid(groupParam)) {
      return res.status(400).json({ error: "Invalid group id" });
    }

    const group = await Group.findById(groupParam);

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    const updates = getAllowedUpdates(req.body, allowedGroupUpdateFields);

    Object.assign(group, updates);

    const invalidAddUsers = addUsers.filter(
      (userId) => !mongoose.Types.ObjectId.isValid(userId),
    );

    const invalidRemoveUsers = removeUsers.filter(
      (userId) => !mongoose.Types.ObjectId.isValid(userId),
    );

    if (invalidAddUsers.length > 0 || invalidRemoveUsers.length > 0) {
      return res.status(400).json({ error: "Invalid user id in request" });
    }

    const currentUsers = group.users.map((userId) => userId.toString());
    const usersToAdd = addUsers.map(String);
    const usersToRemove = removeUsers.map(String);
    const ownerId = group.owner.toString();

    const updatedUsers = [...new Set([...currentUsers, ...usersToAdd])];

    group.users = updatedUsers.filter((userId) => {
      return userId === ownerId || !usersToRemove.includes(userId);
    });

    await group.save();

    await User.updateMany(
      { _id: { $in: usersToAdd } },
      { $addToSet: { groups: group._id } },
    );

    await User.updateMany(
      { _id: { $in: usersToRemove.filter((userId) => userId !== ownerId) } },
      { $pull: { groups: group._id } },
    );

    const populatedGroup = await Group.findById(group._id)
      .populate("owner")
      .populate("users");

    return res.json(populatedGroup);
  } catch (error) {
    return sendError(res, error, 400);
  }
});

//delete group
router.delete("/:groupParam", requireAuth, async (req, res) => {
  try {
    const { groupParam } = req.params;

    if (!mongoose.Types.ObjectId.isValid(groupParam)) {
      return res.status(400).json({ error: "Invalid group id" });
    }

    const group = await Group.findById(groupParam);

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    const ownerId = group.owner.toString();

    if (ownerId !== req.auth.userId) {
      return res.status(403).json({
        error: "Only the group owner can delete this group",
      });
    }

    await User.updateMany(
      { groups: group._id },
      { $pull: { groups: group._id } },
    );

    await Group.findByIdAndDelete(group._id);

    return res.json({
      message: "Group deleted successfully",
      deletedGroupId: group._id,
    });
  } catch (error) {
    return sendError(res, error, 400);
  }
});

export default router;
