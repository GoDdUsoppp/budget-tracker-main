import express from "express";
import Account from "../models/Account.js";
import Income from "../models/Income.js";
import Expense from "../models/Expense.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const account = new Account(req.body);
    const saved = await account.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const accounts = await Account.find({ userId: req.query.userId }).sort({
      createdAt: -1,
    });
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { alias, accountNumberLast4 } = req.body;

    if (!alias || !alias.trim()) {
      return res.status(400).json({ error: "Alias is required" });
    }

    if (!/^\d{4}$/.test(accountNumberLast4)) {
      return res
        .status(400)
        .json({ error: "Last 4 digits must be exactly 4 numbers" });
    }

    const updatedAccount = await Account.findByIdAndUpdate(
      req.params.id,
      {
        alias: alias.trim(),
        accountNumberLast4,
      },
      { new: true, runValidators: true },
    );

    if (!updatedAccount) {
      return res.status(404).json({ error: "Account not found" });
    }

    res.json(updatedAccount);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const accountId = req.params.id;

    const account = await Account.findByIdAndUpdate(
      accountId,
      { isArchived: true },
      { new: true },
    );

    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }

    res.json({ message: "Account archived successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
