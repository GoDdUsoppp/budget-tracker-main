"use client";

import { useState } from "react";
import RecentTransactions from "./RecentTransactions";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import { formatCurrency } from "../utils/currency";
const ExpenseCharts = ({ income, expenses, categories, showAll = false }) => {
  const [timeFrame, setTimeFrame] = useState("month");

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const filteredExpenses = expenses.filter((expense) => {
    const expenseDate = new Date(expense.date);
    if (timeFrame === "month") {
      return (
        expenseDate.getMonth() === currentMonth &&
        expenseDate.getFullYear() === currentYear
      );
    } else if (timeFrame === "year") {
      return expenseDate.getFullYear() === currentYear;
    }
    return true;
  });

  const categoryData = categories
    .map((category) => {
      const categoryIdStr = (category.id || category._id).toString();
      const total = filteredExpenses
        .filter((expense) => {
          if (!expense.categoryId) return false;
          const expenseCategoryId =
            typeof expense.categoryId === "string"
              ? expense.categoryId
              : expense.categoryId._id;
          return expenseCategoryId?.toString() === categoryIdStr;
        })
        .reduce(
          (sum, expense) =>
            sum + (typeof expense.amount === "number" ? expense.amount : 0),
          0,
        );
      return {
        name: category.name,
        value: total,
        color: category.color || "#8884d8",
      };
    })
    .filter((item) => item.value > 0);

  const monthlyData = [];
  for (let i = 11; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthName = date.toLocaleString("default", { month: "short" });
    const monthYear = `${monthName} ${date.getFullYear()}`;
    const monthTotal = expenses
      .filter((expense) => {
        const expenseDate = new Date(expense.date);
        return (
          expenseDate.getMonth() === date.getMonth() &&
          expenseDate.getFullYear() === date.getFullYear()
        );
      })
      .reduce((sum, expense) => sum + expense.amount, 0);
    monthlyData.push({
      month: monthName,
      amount: monthTotal,
      fullDate: monthYear,
    });
  }

  const dailyData = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayString = date.toISOString().split("T")[0];
    const dayTotal = expenses
      .filter((expense) =>
        expense.date && expense.date.toISOString
          ? expense.date.toISOString().split("T")[0] === dayString
          : expense.date.split("T")[0] === dayString,
      )
      .reduce((sum, expense) => sum + expense.amount, 0);
    dailyData.push({ day: date.getDate(), amount: dayTotal, date: dayString });
  }

  const totalAmount = filteredExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Expense Analytics
        </h2>
        <select
          value={timeFrame}
          onChange={(e) => setTimeFrame(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          <option value="month">This Month</option>
          <option value="year">This Year</option>
          <option value="all">All Time</option>
        </select>
      </div>

      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white shadow-md">
        <h3 className="text-lg font-medium mb-2">
          {timeFrame === "month"
            ? "This Month's"
            : timeFrame === "year"
              ? "This Year's"
              : "Total"}{" "}
          Expenses
        </h3>
        <div className="text-4xl font-bold">
          {formatCurrency(totalAmount.toFixed(2))}
        </div>
        <p className="text-blue-100 mt-2">
          {filteredExpenses.length} transactions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-100 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Category Breakdown
          </h3>
          {categoryData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="#475569"
                    opacity={0.2}
                  />
                  <XAxis
                    type="number"
                    dataKey="value"
                    domain={[0, "dataMax"]}
                    stroke="#64748b"
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={120}
                    stroke="#64748b"
                  />
                  <Tooltip
                    formatter={(value) =>
                      `${formatCurrency(Number(value).toFixed(2))}`
                    }
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Bar
                    dataKey="value"
                    fill="#3B82F6"
                    minPointSize={6}
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No data available
            </div>
          )}
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-100 dark:border-slate-700 p-6">
          <RecentTransactions expenses={filteredExpenses} income={income} />
        </div>
      </div>

      {showAll && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-100 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Monthly Spending Trend
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#475569"
                    opacity={0.2}
                  />
                  <XAxis dataKey="month" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    formatter={(value) =>
                      `${formatCurrency(Number(value).toFixed(2))}`
                    }
                    labelFormatter={(label) => `Month: ${label}`}
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#8884d8"
                    strokeWidth={3}
                    dot={{ fill: "#8884d8", strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-100 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Daily Expenses (Last 30 Days)
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#475569"
                    opacity={0.2}
                  />
                  <XAxis dataKey="day" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    formatter={(value) => `${formatCurrency(Number(value).toFixed(2))}`}
                    labelFormatter={(label) => `Day: ${label}`}
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#82ca9d"
                    fill="#82ca9d"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseCharts;
