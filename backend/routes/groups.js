import express from "express";
import Group from "../models/Group.js";
import User from "../models/User.js";
import Expense from "../models/Expense.js";
import Invitation from "../models/Invitation.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { name, description, userId } = req.body;

    const newGroup = new Group({
      name,
      description,
      createdBy: userId,
      members: [userId],
    });

    const savedGroup = await newGroup.save();
    res.status(201).json(savedGroup);
  } catch (err) {
    res.status(500).json({ error: "Failed to create group" });
  }
});

router.post("/invite", async (req, res) => {
  try {
    const { groupId, senderId, receiverEmail } = req.body;

    const group = await Group.findById(groupId);
    const receiver = await User.findOne({ email: receiverEmail });
    if (!receiver) {
      return res
        .status(404)
        .json({ error: "No account exists with this email address." });
    }

    if (!group) return res.status(404).json({ error: "Group not found" });
    if (receiver && group.members.includes(receiver._id)) {
      return res.status(400).json({ error: "User is already in the group" });
    }

    const invitation = new Invitation({
      groupId,
      senderId,
      receiverEmail,
    });

    await invitation.save();
    res.status(201).json({ message: "Invitation sent successfully!" });
  } catch (err) {
    res.status(500).json({ error: "Failed to send invitation" });
  }
});

router.get("/invitations/:email", async (req, res) => {
  try {
    const invites = await Invitation.find({
      receiverEmail: req.params.email,
      status: "pending",
    })
      .populate("groupId", "name")
      .populate("senderId", "name email");

    res.status(200).json(invites);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch invitations" });
  }
});

router.post("/invitations/:id/accept", async (req, res) => {
  try {
    const { userId } = req.body;

    const invitation = await Invitation.findById(req.params.id);
    if (!invitation)
      return res.status(404).json({ error: "Invitation not found" });
    if (invitation.status !== "pending")
      return res.status(400).json({ error: "Invitation already processed" });

    invitation.status = "accepted";
    await invitation.save();

    const group = await Group.findById(invitation.groupId);
    if (!group.members.includes(userId)) {
      group.members.push(userId);
      await group.save();
    }

    res
      .status(200)
      .json({ message: "Joined group successfully!", groupId: group._id });
  } catch (err) {
    res.status(500).json({ error: "Failed to accept invitation" });
  }
});

router.get("/user/:userId", async (req, res) => {
  try {
    const groups = await Group.find({ members: req.params.userId }).populate(
      "members",
      "name email",
    );

    res.status(200).json(groups);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch groups" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.query.userId;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ error: "Group not found" });

    if (group.createdBy.toString() !== userId) {
      return res
        .status(403)
        .json({ error: "Only the group creator can delete this group." });
    }

    const groupExpenses = await Expense.find({ groupId });

    const hasUnsettled = groupExpenses.some((exp) =>
      exp.splitDetails.some(
        (split) => !split.hasPaid || (split.hasPaid && !split.incomeClaimed),
      ),
    );

    if (hasUnsettled) {
      return res.status(400).json({
        error:
          "Cannot delete group: There are pending debts or unclaimed payments!",
      });
    }

    await Expense.deleteMany({ groupId });
    await Invitation.deleteMany({ groupId });
    await Group.findByIdAndDelete(groupId);

    res.status(200).json({ message: "Group deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete group" });
  }
});

export default router;
