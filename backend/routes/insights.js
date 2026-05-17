import express from "express";
import Expense from "../models/Expense.js";
import Income from "../models/Income.js";

const router = express.Router();

router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const userBudget = Number(req.query.budget) || 0;

    if (!userId) {
      return res.status(400).json({ message: "User ID required" });
    }

    const expenses = await Expense.find({ userId }).populate("categoryId");
    const incomes = await Income.find({ userId });

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const savingsLastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const thisMonthExpenses = expenses.filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const lastMonthExpenses = expenses.filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === savingsLastMonth && d.getFullYear() === lastMonthYear;
    });

    const thisMonthIncomes = incomes.filter((i) => {
      const d = new Date(i.date || i.createdAt);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const sum = (arr) => arr.reduce((acc, e) => acc + (e.amount || 0), 0);
    const total = sum(expenses);
    const thisMonthTotal = sum(thisMonthExpenses);
    const lastMonthTotal = sum(lastMonthExpenses);
    const thisMonthIncomeTotal = sum(thisMonthIncomes);

    let categoryMap = {};
    expenses.forEach((exp) => {
      const amount = exp.amount || 0;
      const category = exp.categoryId?.name || "Other";
      categoryMap[category] = (categoryMap[category] || 0) + amount;
    });

    const categoryData = Object.keys(categoryMap)
      .map((key) => ({ name: key, value: categoryMap[key] }))
      .sort((a, b) => b.value - a.value);

    let topCategory = null;
    let topValue = 0;
    let topPercent = 0;

    if (categoryData.length > 0) {
      const top = categoryData[0];
      topCategory = top.name;
      topValue = top.value;
      topPercent = total ? (topValue / total) * 100 : 0;
    }

    let predictedNextMonth = 0;
    const monthlyTotals = [];
    for (let i = 0; i < 6; i++) {
      let targetMonth = currentMonth - i;
      let targetYear = currentYear;
      if (targetMonth < 0) {
        targetMonth += 12;
        targetYear -= 1;
      }
      const monthSum = sum(expenses.filter(e => new Date(e.date).getMonth() === targetMonth && new Date(e.date).getFullYear() === targetYear));
      if (monthSum > 0) monthlyTotals.unshift(monthSum);
    }

    if (monthlyTotals.length >= 2) {
      const avgSpending = monthlyTotals.reduce((a, b) => a + b, 0) / monthlyTotals.length;
      const growthRate = lastMonthTotal > 0 ? (thisMonthTotal - lastMonthTotal) / lastMonthTotal : 0;
      predictedNextMonth = Math.round((avgSpending * 0.7) + (thisMonthTotal * (1 + growthRate) * 0.3));
    } else {
      predictedNextMonth = Math.round(total * 1.1) || 0;
    }

    let trend = 0;
    let trendPercent = 0;
    if (lastMonthTotal > 0) {
      trend = thisMonthTotal - lastMonthTotal;
      trendPercent = (trend / lastMonthTotal) * 100;
    }

    let insights = [];
    let score = 100;

    if (userBudget > 0) {
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const percentOfMonthElapsed = now.getDate() / daysInMonth;
      const percentOfBudgetSpent = thisMonthTotal / userBudget;

      if (percentOfBudgetSpent > 1) {
        insights.push("You have exceeded your monthly budget. Pause non-essential spending.");
        score -= 30;
      } else if (percentOfBudgetSpent > percentOfMonthElapsed + 0.15) {
        insights.push(`You're spending too fast. You've spent ${Math.round(percentOfBudgetSpent * 100)}% of your budget, but only ${Math.round(percentOfMonthElapsed * 100)}% of the month has passed.`);
        score -= 15;
      } else if (percentOfBudgetSpent < percentOfMonthElapsed) {
        insights.push("Great job! Your spending is perfectly paced for the month.");
      }
    } else {
      insights.push("💡 Set a monthly budget to unlock spending pace alerts.");
    }

    if (thisMonthIncomeTotal > 0) {
      const savingsRate = ((thisMonthIncomeTotal - thisMonthTotal) / thisMonthIncomeTotal) * 100;
      if (savingsRate >= 20) {
        insights.push(`Excellent! You are saving ${savingsRate.toFixed(1)}% of your income this month.`);
      } else if (savingsRate > 0) {
        insights.push(`Your savings rate is ${savingsRate.toFixed(1)}%. Try cutting back to hit the 20% target.`);
        score -= 10;
      } else {
        insights.push("You are spending more than you earn this month. Check your top expenses.");
        score -= 25;
      }
    }

    if (topPercent > 40) {
      insights.push(`Watch out! ${topCategory} makes up ${Math.round(topPercent)}% of your total spending.`);
      score -= 15;
    }

    if (trend > 0 && lastMonthTotal > 0) {
      insights.push(`Your expenses are up ₹${trend} compared to last month.`);
      score -= 10;
    } else if (trend < 0) {
      insights.push(`You saved ₹${Math.abs(trend)} compared to last month's pace.`);
      score += 10;
    }

    score = Math.max(0, Math.min(100, score));

    let monthlyMap = {};
    expenses.forEach((exp) => {
      const d = new Date(exp.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap[key] = (monthlyMap[key] || 0) + (exp.amount || 0);
    });

    let incomeMonthlyMap = {};
    incomes.forEach((inc) => {
      const d = new Date(inc.date || inc.createdAt);
      if (isNaN(d)) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      incomeMonthlyMap[key] = (incomeMonthlyMap[key] || 0) + (inc.amount || 0);
    });

    let combinedMap = {};
    Object.keys(monthlyMap).forEach((month) => {
      if (!combinedMap[month]) combinedMap[month] = { month, income: 0, expense: 0 };
      combinedMap[month].expense = monthlyMap[month];
    });
    Object.keys(incomeMonthlyMap).forEach((month) => {
      if (!combinedMap[month]) combinedMap[month] = { month, income: 0, expense: 0 };
      combinedMap[month].income = incomeMonthlyMap[month];
    });

    const combinedMonthlyData = Object.values(combinedMap).sort((a, b) => a.month.localeCompare(b.month));

    let incomeCategoryMap = {};
    incomes.forEach((inc) => {
      const category = inc.category || "Other";
      incomeCategoryMap[category] = (incomeCategoryMap[category] || 0) + (inc.amount || 0);
    });
    const incomeCategoryData = Object.keys(incomeCategoryMap).map((key) => ({
      name: key, value: incomeCategoryMap[key]
    }));

    res.json({
      total,
      thisMonthTotal,
      insights,
      predictedNextMonth,
      financialScore: score,
      categoryData,
      trend, 
      trendPercent,
      topCategory: {
        name: topCategory,
        value: topValue,
        percent: topPercent,
      },
      incomeCategoryData,
      combinedMonthlyData,
    });
  } catch (err) {
    console.error("INSIGHTS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;