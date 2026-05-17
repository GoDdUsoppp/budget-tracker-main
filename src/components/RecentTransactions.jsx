import React from "react";
import { formatCurrency } from "../utils/currency";

export default function RecentTransactions({ expenses = [], income = [] }) {
  const combinedTransactions = [
    ...expenses.map((expense) => ({ ...expense, type: "expense" })),
    ...income.map((inc) => ({ ...inc, type: "income" })),
  ];

  const recentTransactions = combinedTransactions
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
        Recent Transactions
      </h3>

      {recentTransactions.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          No recent transactions found.
        </p>
      ) : (
        <div className="space-y-4">
          {recentTransactions.map((transaction) => {
            const isIncome = transaction.type === "income";
            const amountColor = isIncome
              ? "text-green-600 dark:text-green-500"
              : "text-red-600 dark:text-red-500";
            const sign = isIncome ? "+" : "-";

            return (
              <div
                key={`${transaction.type}-${transaction.id || transaction._id}`}
                className="flex justify-between items-center border-b border-gray-100 dark:border-slate-700 pb-3 last:border-0 last:pb-0"
              >
                <div>
                  <p className="font-semibold text-gray-700 dark:text-gray-200">
                    {transaction.note ||
                      transaction.description ||
                      "Unnamed Transaction"}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {new Date(transaction.date).toLocaleDateString()}
                  </p>
                </div>
                <div className={`font-bold ${amountColor}`}>
                  {sign}
                  {formatCurrency(transaction.amount)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
