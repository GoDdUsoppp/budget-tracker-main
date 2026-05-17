import express from "express";
import Income from "../models/Income.js";
import Account from "../models/Account.js";
import Expense from "../models/Expense.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { amount, account } = req.body;

    const income = new Income(req.body);
    const savedIncome = await income.save();

    await Account.findByIdAndUpdate(account, { $inc: { balance: amount } });

    const { claimingExpenseId, claimingUserId } = req.body;

    if (claimingExpenseId && claimingUserId) {
      await Expense.updateOne(
        { _id: claimingExpenseId, "splitDetails.user": claimingUserId },
        { $set: { "splitDetails.$.incomeClaimed": true } },
      );
    }

    res.status(201).json(savedIncome);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const oldIncome = await Income.findById(req.params.id);

    if (!oldIncome) {
      return res.status(404).json({ error: "Income not found" });
    }

    const { amount, account } = req.body;

    const oldAccount = await Account.findById(oldIncome.account);

    if (!oldAccount) {
      return res.status(404).json({ error: "Account not found" });
    }

    const difference = amount - oldIncome.amount;

    const newBalance = oldAccount.balance + difference;

    if (newBalance < 0 && !req.query.force) {
      return res.status(400).json({
        warning: true,
        message: "Updating this income will make account balance negative",
        currentBalance: oldAccount.balance,
        newBalance,
      });
    }

    oldAccount.balance = newBalance;
    await oldAccount.save();

    oldIncome.amount = amount;
    oldIncome.note = req.body.note;
    oldIncome.description = req.body.description;
    oldIncome.category = req.body.category;
    oldIncome.date = req.body.date;
    oldIncome.account = account;

    await oldIncome.save();

    res.json({
      message: "Income updated successfully",
      income: oldIncome,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/", async (req, res) => {
  const { userId } = req.query;

  const income = await Income.find({ userId })
    .populate("account")
    .sort({ createdAt: -1 });

  res.json(income);
});

router.delete("/:id", async (req, res) => {
  try {
    const income = await Income.findById(req.params.id);

    if (!income) {
      return res.status(404).json({ error: "Income not found" });
    }

    const account = await Account.findById(income.account);

    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }

    const newBalance = account.balance - income.amount;

    if (newBalance < 0 && !req.query.force) {
      return res.status(400).json({
        warning: true,
        message: "Deleting this income will make the account balance negative.",
        currentBalance: account.balance,
        newBalance,
      });
    }

    account.balance = newBalance;
    await account.save();

    await income.deleteOne();

    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
