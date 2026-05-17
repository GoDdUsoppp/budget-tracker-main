import { useEffect, useState } from "react";
import axios from "axios";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { formatCurrency } from "../utils/currency";

export default function Insights() {
  const [data, setData] = useState(null);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [budgetMessage, setBudgetMessage] = useState({ type: "", text: "" });

  const [budget, setBudget] = useState(
    () => Number(localStorage.getItem("budget")) || 0,
  );
  const [budgetInput, setBudgetInput] = useState(
    () => localStorage.getItem("budget") || "",
  );

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return;
    const user = JSON.parse(storedUser);
    axios
      .get(`/api/insights/${user.id}?budget=${budget}`)
      .then((res) => setData(res.data))
      .catch((err) => console.error(err));
  }, [budget]);

  useEffect(() => {
    if (!data) return;
    let start = 0;
    const end = data.financialScore || 0;
    if (end === 0) return setAnimatedScore(0);
    const interval = setInterval(() => {
      start += 1;
      setAnimatedScore(start);
      if (start >= end) clearInterval(interval);
    }, 20);
    return () => clearInterval(interval);
  }, [data]);

  useEffect(() => {
    if (!budgetMessage.text) return;
    const timer = setTimeout(
      () => setBudgetMessage({ type: "", text: "" }),
      2500,
    );
    return () => clearTimeout(timer);
  }, [budgetMessage]);

  const categoryData = data?.categoryData || [];
  const topCategory = data?.topCategory;
  const trend = data?.trend || 0;
  const trendPercent = data?.trendPercent || 0;
  const monthlySpent = data?.thisMonthTotal || 0;

  const getScoreColor = (score) => {
    if (score >= 80) return "from-green-400 to-green-500";
    if (score >= 60) return "from-yellow-400 to-yellow-500";
    if (score >= 40) return "from-orange-400 to-orange-500";
    return "from-red-400 to-red-500";
  };

  const getTrendDisplay = () => {
    if (trend > 0) {
      return { arrow: "↑", color: "text-red-500", text: `+${formatCurrency(trend)} (+${trendPercent.toFixed(1)}%)` };
    } else if (trend < 0) {
      return { arrow: "↓", color: "text-green-500", text: `-${formatCurrency(Math.abs(trend))} (${trendPercent.toFixed(1)}%)` };
    } else {
      return { arrow: "→", color: "text-gray-500 dark:text-gray-400", text: "No change" };
    }
  };

  const saveBudget = () => {
    setBudgetMessage({ type: "", text: "" });
    const value = Number(budgetInput);
    if (!budgetInput || isNaN(value) || value <= 0) {
      setBudgetMessage({ type: "error", text: "Please enter a valid positive number" });
      return;
    }
    localStorage.setItem("budget", value);
    setBudget(value);
    setBudgetMessage({ type: "success", text: "Budget saved successfully" });
    setBudgetInput("");
  };

  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysLeft = daysInMonth - today.getDate() + 1;
  const remainingBudget = budget - monthlySpent;
  const safeDailySpend = budget > 0 && remainingBudget > 0 ? Math.floor(remainingBudget / daysLeft) : 0;

  if (!data) return <p className="text-gray-500 dark:text-gray-400">Loading insights...</p>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className={`p-6 rounded-2xl text-center text-white shadow-lg bg-gradient-to-br ${getScoreColor(data.financialScore)} transform transition-transform hover:-translate-y-1`}>
          <h3 className="text-sm font-semibold opacity-90">Financial Health</h3>
          <div className="w-24 h-24 rounded-full bg-white/30 flex items-center justify-center mx-auto my-4">
            <span className="text-3xl font-bold">{animatedScore}</span>
          </div>
          <p className="text-sm opacity-90">/ 100</p>
        </div>

        <div className="p-6 rounded-2xl text-center shadow-lg bg-gradient-to-br from-sky-100 to-sky-200 dark:from-sky-900 dark:to-sky-800 transform transition-transform hover:-translate-y-1 flex flex-col justify-center">
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Top Expense Category</span>
          <h2 className="text-2xl font-bold mt-4 text-slate-800 dark:text-white">{topCategory?.name || "None"}</h2>
          <p className="text-xl font-bold mt-1 text-slate-700 dark:text-slate-200">
            {formatCurrency(topCategory?.value || 0)} <span className="text-sm text-slate-500 dark:text-slate-400 font-normal">({topCategory?.percent?.toFixed(1) || 0}%)</span>
          </p>
        </div>

        <div className="p-6 rounded-2xl text-center shadow-lg bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 transform transition-transform hover:-translate-y-1 flex flex-col justify-center">
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Next Month Prediction</span>
          <h2 className="text-2xl font-bold mt-4 text-slate-800 dark:text-white">{formatCurrency(data.predictedNextMonth)}</h2>
          <span className={`text-sm font-medium mt-1 ${getTrendDisplay().color}`}>
            {getTrendDisplay().arrow} {getTrendDisplay().text}
          </span>
        </div>

        <div className="p-6 rounded-2xl text-center text-white shadow-lg bg-gradient-to-br from-teal-400 to-teal-600 transform transition-transform hover:-translate-y-1">
          <h3 className="text-sm font-semibold opacity-90">Safe to Spend</h3>
          <div className="w-24 h-24  flex items-center justify-center mx-auto my-4">
            <span className="text-3xl font-bold">{formatCurrency(safeDailySpend)}</span>
          </div>
          <p className="text-sm opacity-90">/ day</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Set Monthly Budget</h3>
          <div className="flex gap-3">
            <input
              type="number"
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 50000"
            />
            <button onClick={saveBudget} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
              Save
            </button>
          </div>
          {budgetMessage.text && (
            <p className={`mt-2 text-sm ${budgetMessage.type === "error" ? "text-red-500" : "text-green-500"}`}>
              {budgetMessage.text}
            </p>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Budget Status</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{formatCurrency(monthlySpent)} / {formatCurrency(budget || "Not set")}</p>
          <div className="w-full h-3 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${budget && monthlySpent > budget ? "bg-red-500" : budget && monthlySpent > budget * 0.8 ? "bg-orange-500" : "bg-green-500"}`}
              style={{ width: `${budget ? Math.min((monthlySpent / budget) * 100, 100) : 0}%` }}
            />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">AI Insights</h3>
        <div className="space-y-3">
          {data.insights.map((item, i) => (
            <div key={i} className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl text-slate-700 dark:text-slate-200 text-sm">
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
          <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">Spending Breakdown</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} dataKey="value" outerRadius={90} cx="50%" cy="50%">
                  {categoryData.map((entry, index) => (
                    <Cell key={index} fill={["#3b82f6", "#22c55e", "#f97316", "#eab308", "#a855f7"][index % 5]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
          <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">Income vs Expenses</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.combinedMonthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#475569" opacity={0.2} />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Line type="monotone" dataKey="expense" stroke="#3b82f6" strokeWidth={3} name="Expenses" dot={{r: 4}} />
                <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={3} name="Income" dot={{r: 4}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}