import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency } from "../utils/currency";

export default function Statement() {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);

  const [filterType, setFilterType] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [accountFilter, setAccountFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const fetchData = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const [incomeRes, expenseRes, accountRes] = await Promise.all([
      fetch(`http://localhost:3001/api/income?userId=${user.id}`),
      fetch(`http://localhost:3001/api/expenses?userId=${user.id}`),
      fetch(`http://localhost:3001/api/accounts?userId=${user.id}`),
    ]);

    const incomeData = await incomeRes.json();
    const expenseData = await expenseRes.json();
    const accountData = await accountRes.json();
    const accountMap = {};

    accountData.forEach((a) => {
      accountMap[String(a._id)] = a;
    });
    setAccounts(accountData);

    const normalizedIncome = incomeData.map((i) => {
      const acc = accountMap[String(i.account?._id || i.account)];
      return {
        ...i,
        type: "income",
        transactionDate: new Date(i.date),
        category: i.category || "Other",
        accountId: String(i.account?._id || i.account),
        accountName: acc
          ? acc.type === "cash"
            ? "Cash"
            : acc.alias || acc.name
          : "Unknown",
      };
    });

    const normalizedExpense = expenseData.map((e) => {
      const acc = accountMap[String(e.account?._id || e.account)];
      return {
        ...e,
        type: "expense",
        transactionDate: new Date(e.date),
        category:
          typeof e.categoryId === "object"
            ? e.categoryId?.name
            : e.categoryId || "Other",
        accountId: String(e.account?._id || e.account),
        accountName: acc
          ? acc.type === "cash"
            ? "Cash"
            : acc.alias || acc.name
          : "Unknown",
      };
    });

    const merged = [...normalizedIncome, ...normalizedExpense];
    merged.sort((a, b) => b.transactionDate - a.transactionDate);
    setTransactions(merged);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredTransactions = transactions.filter((t) => {
    if (filterType !== "all" && t.type !== filterType) return false;
    if (accountFilter !== "all") {
      const accountId = t.account?._id || t.account;
      if (accountId !== accountFilter) return false;
    }
    if (startDate && new Date(t.transactionDate) < new Date(startDate))
      return false;
    if (endDate && new Date(t.transactionDate) > new Date(endDate))
      return false;

    const now = new Date();
    if (timeFilter === "today")
      return t.transactionDate.toDateString() === now.toDateString();
    if (timeFilter === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      return t.transactionDate >= weekAgo;
    }
    if (timeFilter === "month")
      return (
        t.transactionDate.getMonth() === now.getMonth() &&
        t.transactionDate.getFullYear() === now.getFullYear()
      );
    if (timeFilter === "year")
      return t.transactionDate.getFullYear() === now.getFullYear();
    return true;
  });

  const transactionsWithBalance = [];
  let runningBalance = 0;

  const sorted = [...filteredTransactions].sort(
    (a, b) => new Date(a.transactionDate) - new Date(b.transactionDate),
  );
  sorted.forEach((t) => {
    if (t.type === "income") runningBalance += t.amount;
    else runningBalance -= t.amount;
    transactionsWithBalance.push({ ...t, balance: runningBalance });
  });

  transactionsWithBalance.reverse();

  const exportToPDF = () => {
    const groupedByAccount = {};
    filteredTransactions.forEach((t) => {
      const key = String(t.accountId || "unknown");
      if (!groupedByAccount[key]) {
        groupedByAccount[key] = {
          name: t.accountName || "Unknown",
          transactions: [],
        };
      }
      groupedByAccount[key].transactions.push(t);
    });

    const doc = new jsPDF();
    const accounts = Object.values(groupedByAccount);

    accounts.forEach((account, index) => {
      if (index > 0) doc.addPage();
      const transactions = account.transactions;
      const accountName = account.name;
      let runningBalance = 0;
      const transactionsWithBalance = [];

      transactions
        .sort(
          (a, b) => new Date(a.transactionDate) - new Date(b.transactionDate),
        )
        .forEach((t) => {
          if (t.type === "income") runningBalance += Number(t.amount);
          else runningBalance -= Number(t.amount);
          transactionsWithBalance.push({ ...t, balance: runningBalance });
        });

      transactionsWithBalance.reverse();

      doc.setFontSize(14);
      let y = 35;
      doc.text(`Account: ${accountName}`, 14, y);
      y += 6;
      doc.text(
        `Date: ${startDate || endDate ? `${startDate || ""} - ${endDate || ""}` : "All"}`,
        14,
        y,
      );
      y += 6;

      const now = new Date();
      doc.text(
        `Generated: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
        14,
        y,
      );
      y += 10;

      let totalIncome = 0;
      let totalExpense = 0;
      transactions.forEach((t) => {
        if (t.type === "income") totalIncome += Number(t.amount);
        else totalExpense += Number(t.amount);
      });

      doc.text(`Income: Rs. ${totalIncome.toLocaleString("en-IN")}`, 14, y);
      y += 6;
      doc.text(`Expense: Rs. ${totalExpense.toLocaleString("en-IN")}`, 14, y);
      y += 10;

      const tableData = transactionsWithBalance.map((t) => [
        new Date(t.transactionDate).toLocaleDateString(),
        t.note,
        t.category || "-",
        t.type === "income"
          ? `+Rs. ${Number(t.amount).toLocaleString("en-IN")}`
          : `-Rs. ${Number(t.amount).toLocaleString("en-IN")}`,
        `Rs. ${Number(t.balance).toLocaleString("en-IN")}`,
      ]);

      autoTable(doc, {
        head: [["Date", "Note", "Category", "Amount", "Balance"]],
        body: tableData,
        startY: y,
        headStyles: { fillColor: [37, 99, 235] },
        columnStyles: {
          1: { cellWidth: "auto", overflow: "linebreak" },
          3: { halign: "right", cellWidth: 35, overflow: "linebreak" },
          4: { halign: "right", cellWidth: 35, overflow: "linebreak" },
        },
      });
    });
    doc.save("statement.pdf");
  };

  return (
    <div className="space-y-8 text-gray-900 dark:text-gray-100">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
        Account Statement
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700">
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Account
          </label>
          <select
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className="border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white px-3 py-2 rounded w-full focus:outline-none"
          >
            <option value="all">All Accounts</option>
            {accounts.map((acc) => (
              <option key={acc._id} value={acc._id}>
                {acc.type === "cash"
                  ? "Cash"
                  : `${acc.alias} (****${acc.accountNumberLast4})`}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            From
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white px-3 py-2 rounded w-full focus:outline-none"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            To
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white px-3 py-2 rounded w-full focus:outline-none"
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={() => {
              setFilterType("all");
              setTimeFilter("all");
              setAccountFilter("all");
              setStartDate("");
              setEndDate("");
            }}
            className="bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-500 text-gray-800 dark:text-white px-3 py-2 rounded text-sm w-full transition-colors"
          >
            Reset Filters
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setFilterType("all")}
          className={`px-3 py-1 rounded text-sm transition-colors ${filterType === "all" ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-slate-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-slate-600"}`}
        >
          All
        </button>
        <button
          onClick={() => setFilterType("income")}
          className={`px-3 py-1 rounded text-sm transition-colors ${filterType === "income" ? "bg-green-600 text-white" : "bg-gray-200 dark:bg-slate-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-slate-600"}`}
        >
          Income
        </button>
        <button
          onClick={() => setFilterType("expense")}
          className={`px-3 py-1 rounded text-sm transition-colors ${filterType === "expense" ? "bg-red-600 text-white" : "bg-gray-200 dark:bg-slate-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-slate-600"}`}
        >
          Expenses
        </button>

        <button
          onClick={exportToPDF}
          className="ml-auto bg-gray-700 dark:bg-slate-600 hover:bg-gray-800 dark:hover:bg-slate-500 text-white px-4 py-1.5 rounded text-sm transition-colors"
        >
          Export PDF
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {["all", "today", "week", "month", "year"].map((t) => (
          <button
            key={t}
            onClick={() => setTimeFilter(t)}
            className={`px-3 py-1 rounded text-sm transition-colors ${timeFilter === t ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-slate-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-slate-600"}`}
          >
            {t === "all" ? "All Time" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-700/50 text-left text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Note</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold text-right">Amount</th>
              </tr>
            </thead>

            <tbody>
              {transactionsWithBalance.length === 0 && (
                <tr>
                  <td
                    colSpan="4"
                    className="text-center py-8 text-gray-500 dark:text-gray-400"
                  >
                    No transactions found
                  </td>
                </tr>
              )}

              {transactionsWithBalance.map((t) => (
                <tr
                  key={t._id}
                  onClick={() => setSelectedTransaction(t)}
                  className="border-b border-gray-50 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-700/30 cursor-pointer transition-colors text-gray-800 dark:text-gray-200"
                >
                  <td className="px-4 py-3">
                    {new Date(t.transactionDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {t.note?.length > 20 ? t.note.slice(0, 20) + "..." : t.note}
                  </td>
                  <td className="px-4 py-3 capitalize">{t.category}</td>
                  <td
                    className={`px-4 py-3 text-right font-medium max-w-[120px] truncate ${t.type === "income" ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"}`}
                    title={`${formatCurrency(t.amount)}`}
                  >
                    {t.type === "income" ? "+" : "-"}
                    {formatCurrency(t.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-2xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setSelectedTransaction(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
            >
              ✕
            </button>

            <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-700 pb-2">
              Transaction Details
            </h3>

            <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Type:</span>
                <span className="font-medium capitalize">
                  {selectedTransaction.type}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">
                  Amount:
                </span>
                <span
                  className={`font-medium ${selectedTransaction.type === "income" ? "text-green-600" : "text-red-600"}`}
                >
                  {formatCurrency(selectedTransaction.amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">
                  Category:
                </span>
                <span className="font-medium capitalize">
                  {selectedTransaction.category}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Date:</span>
                <span className="font-medium">
                  {new Date(
                    selectedTransaction.transactionDate,
                  ).toLocaleString()}
                </span>
              </div>
              <div className="pt-2">
                <span className="text-gray-500 dark:text-gray-400 block mb-1">
                  Note:
                </span>
                <div className="bg-gray-50 dark:bg-slate-700/50 p-3 rounded font-medium">
                  {selectedTransaction.note}
                </div>
              </div>
              {selectedTransaction.description && (
                <div>
                  <span className="text-gray-500 dark:text-gray-400 block mb-1">
                    Description:
                  </span>
                  <div className="bg-gray-50 dark:bg-slate-700/50 p-3 rounded">
                    {selectedTransaction.description}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
