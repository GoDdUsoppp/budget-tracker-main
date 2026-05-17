import express from "express";
import mongoose from "mongoose";
import User from "../models/User.js";
import Income from "../models/Income.js";
import Expense from "../models/Expense.js";
import { requireAdmin } from "../middleware/adminAuth.js";

const router = express.Router();

router.get("/stats", requireAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalTransactions =
      (await Income.countDocuments()) + (await Expense.countDocuments());

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const objectIdFromDate = (date) =>
      new mongoose.Types.ObjectId(
        Math.floor(date.getTime() / 1000).toString(16) + "0000000000000000",
      );
    const newSignupsWeek = await User.countDocuments({
      _id: { $gte: objectIdFromDate(oneWeekAgo) },
    });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const activeExpenseUsers = await Expense.distinct("userId", {
      date: { $gte: startOfToday },
    });
    const activeIncomeUsers = await Income.distinct("userId", {
      date: { $gte: startOfToday },
    });
    const uniqueActiveUsers = new Set([
      ...activeExpenseUsers.map((id) => id.toString()),
      ...activeIncomeUsers.map((id) => id.toString()),
    ]);
    const activeUsersToday = uniqueActiveUsers.size;

    const incomeData = await Income.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalRevenue = incomeData.length > 0 ? incomeData[0].total : 0;

    const expenseData = await Expense.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalExpenses = expenseData.length > 0 ? expenseData[0].total : 0;

    const avgExpense =
      totalTransactions > 0
        ? totalExpenses / (await Expense.countDocuments()) || 0
        : 0;
    const savingsRate =
      totalRevenue > 0
        ? ((totalRevenue - totalExpenses) / totalRevenue) * 100
        : 0;

    const topIncomesLimit = await Income.find()
      .sort({ amount: -1 })
      .limit(5)
      .populate("userId", "name email");
    const topExpensesLimit = await Expense.find()
      .sort({ amount: -1 })
      .limit(5)
      .populate("userId", "name email");

    let whales = [];
    topIncomesLimit.forEach((i) =>
      whales.push({
        id: `inc_${i._id}`,
        type: "Income",
        amount: i.amount,
        user: i.userId?.name || "Unknown",
        email: i.userId?.email || "",
        date: i.date || i.createdAt,
      }),
    );
    topExpensesLimit.forEach((e) =>
      whales.push({
        id: `exp_${e._id}`,
        type: "Expense",
        amount: e.amount,
        user: e.userId?.name || "Unknown",
        email: e.userId?.email || "",
        date: e.date || e.createdAt,
      }),
    );

    whales.sort((a, b) => b.amount - a.amount);
    const whaleTransactions = whales.slice(0, 5);

    const topExpenseCategoriesAgg = await Expense.aggregate([
      { $group: { _id: "$categoryId", value: { $sum: "$amount" } } },
      { $sort: { value: -1 } },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "catInfo",
        },
      },
      { $unwind: { path: "$catInfo", preserveNullAndEmptyArrays: true } },
    ]);
    const topExpenseCategories = topExpenseCategoriesAgg.map((c) => ({
      name: c.catInfo?.name || "Uncategorized",
      value: c.value,
    }));

    const topIncomeCategoriesAgg = await Income.aggregate([
      { $group: { _id: "$category", value: { $sum: "$amount" } } },
      { $sort: { value: -1 } },
    ]);
    const topIncomeCategories = topIncomeCategoriesAgg.map((c) => ({
      name: c._id
        ? c._id.charAt(0).toUpperCase() + c._id.slice(1)
        : "Uncategorized",
      value: c.value,
    }));

    // Recent Activity
    const recentUsers = await User.find()
      .sort({ _id: -1 })
      .limit(3)
      .select("name _id");
    const recentIncomes = await Income.find()
      .sort({ _id: -1 })
      .limit(3)
      .select("amount _id");
    const recentExpenses = await Expense.find()
      .sort({ _id: -1 })
      .limit(3)
      .select("amount _id");

    let activities = [];
    recentUsers.forEach((u) =>
      activities.push({
        id: `usr_${u._id}`,
        type: "New User",
        message: `${u.name} joined Budget Tracker.`,
        time: u._id.getTimestamp(),
        color: "text-blue-600",
      }),
    );
    recentIncomes.forEach((i) =>
      activities.push({
        id: `inc_${i._id}`,
        type: "Income",
        message: `${i.amount} was tracked.`,
        time: i._id.getTimestamp(),
        color: "text-green-600",
      }),
    );
    recentExpenses.forEach((e) =>
      activities.push({
        id: `exp_${e._id}`,
        type: "Expense",
        message: `${e.amount} was logged.`,
        time: e._id.getTimestamp(),
        color: "text-red-600",
      }),
    );
    activities.sort((a, b) => b.time - a.time);
    const recentActivity = activities.slice(0, 6);

    const monthlyIncomes = await Income.aggregate([
      { $group: { _id: { $month: "$date" }, revenue: { $sum: "$amount" } } },
      { $sort: { _id: 1 } },
    ]);
    const monthlyExpenses = await Expense.aggregate([
      { $group: { _id: { $month: "$date" }, expenses: { $sum: "$amount" } } },
      { $sort: { _id: 1 } },
    ]);

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    let cashflowData = [];
    for (let i = 1; i <= 12; i++) {
      const inc = monthlyIncomes.find((m) => m._id === i) || { revenue: 0 };
      const exp = monthlyExpenses.find((m) => m._id === i) || { expenses: 0 };
      if (inc.revenue > 0 || exp.expenses > 0)
        cashflowData.push({
          name: monthNames[i - 1],
          revenue: inc.revenue,
          expenses: exp.expenses,
        });
    }

    res.json({
      pulse: {
        totalUsers,
        totalTransactions,
        activeUsersToday,
        newSignupsWeek,
        recentActivity,
        whaleTransactions,
      },
      financials: {
        totalRevenue,
        totalExpenses,
        avgExpense,
        savingsRate,
        cashflowData:
          cashflowData.length > 0
            ? cashflowData
            : [{ name: "No Data", revenue: 0, expenses: 0 }],
        topExpenseCategories:
          topExpenseCategories.length > 0 ? topExpenseCategories : [],
        topIncomeCategories:
          topIncomeCategories.length > 0 ? topIncomeCategories : [],
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({ error: "Failed to fetch admin stats" });
  }
});

router.get("/users", requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ _id: -1 });
    res.json(users);
  } catch (error) {
    console.error("Fetch users error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.delete("/users/:id", requireAdmin, async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res
        .status(400)
        .json({ message: "You cannot delete your own admin account." });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});
export default router;
