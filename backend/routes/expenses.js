import express from "express";
import Expense from "../models/Expense.js";
import Account from "../models/Account.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { userId, groupId } = req.query;
    let query = {};

    if (userId) {
      query = {
        $or: [{ userId: userId }, { "splitDetails.user": userId }],
      };
    }

    if (groupId) {
      query.groupId = groupId;
    }

    const expenses = await Expense.find(query)
      .populate("groupId", "name")
      .populate("splitDetails.user", "name email")
      .populate("categoryId", "name")
      .sort({ date: -1, _id: -1 });

    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { amount, account, note, userId, settlingDebtId } = req.body;
    const force = req.query.force === "true";

    if (req.body.optimizedPayeeId) {
      const debtsToClear = await Expense.find({
        groupId: req.body.groupId,
        userId: req.body.optimizedPayeeId,
        "splitDetails.user": req.body.userId,
        "splitDetails.hasPaid": false,
      });

      for (let exp of debtsToClear) {
        await Expense.updateOne(
          { _id: exp._id, "splitDetails.user": req.body.userId },
          { $set: { "splitDetails.$.hasPaid": true } },
        );
      }
    }

    if (!note || !note.trim()) {
      return res.status(400).json({ error: "Note is required" });
    }

    const selectedAccount = await Account.findById(account);

    if (!selectedAccount) {
      return res.status(404).json({ error: "Account not found" });
    }

    if (selectedAccount.balance < amount && !force) {
      return res.status(400).json({
        warning: true,
        currentBalance: selectedAccount.balance,
        newBalance: selectedAccount.balance - amount,
      });
    }

    const expense = await Expense.create({
      ...req.body,
      note: note.trim(),
    });

    await Account.findByIdAndUpdate(account, { $inc: { balance: -amount } });

    if (settlingDebtId) {
      await Expense.updateOne(
        { _id: settlingDebtId, "splitDetails.user": userId },
        { $set: { "splitDetails.$.hasPaid": true } },
      );
    }

    res.status(201).json(expense);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const oldExpense = await Expense.findById(req.params.id);

    if (!oldExpense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    const { amount, account, note } = req.body;
    const force = req.query.force === "true";

    if (!note || !note.trim()) {
      return res.status(400).json({ error: "Note is required" });
    }

    const oldAccount = await Account.findById(oldExpense.account);
    const newAccount = await Account.findById(account);

    if (!oldAccount || !newAccount) {
      return res.status(404).json({ error: "Account not found" });
    }

    let balanceAfter;

    if (oldExpense.account.toString() === account) {
      balanceAfter = oldAccount.balance + oldExpense.amount - amount;

      if (balanceAfter < 0 && !force) {
        return res.status(400).json({
          warning: true,
          currentBalance: oldAccount.balance,
          newBalance: balanceAfter,
        });
      }

      oldAccount.balance = balanceAfter;
      await oldAccount.save();
    } else {
      const newAccountBalanceAfter = newAccount.balance - amount;

      if (newAccountBalanceAfter < 0 && !force) {
        return res.status(400).json({
          warning: true,
          currentBalance: newAccount.balance,
          newBalance: newAccountBalanceAfter,
        });
      }

      oldAccount.balance += oldExpense.amount;
      await oldAccount.save();

      newAccount.balance -= amount;
      await newAccount.save();
    }

    const updatedExpense = await Expense.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        note: note.trim(),
      },
      { new: true },
    );

    res.json(updatedExpense);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    await Account.findByIdAndUpdate(expense.account, {
      $inc: { balance: expense.amount },
    });

    await Expense.findByIdAndDelete(req.params.id);

    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
