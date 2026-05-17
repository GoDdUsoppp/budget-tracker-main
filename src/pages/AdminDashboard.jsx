import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Users,
  Activity,
  LogOut,
  PieChart as PieChartIcon,
} from "lucide-react";
import { getAdminStats, getAllUsers } from "../services/api";
import { formatCurrency } from "../utils/currency";
const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
];

export default function AdminDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState("pulse");
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({ pulse: {}, financials: {} });
  const [usersList, setUsersList] = useState([]);

  useEffect(() => {
    fetchMainStats();
  }, []);

  useEffect(() => {
    if (activeTab === "users" && usersList.length === 0) fetchUsers();
  }, [activeTab, usersList.length]);

  const fetchMainStats = async () => {
    try {
      const response = await getAdminStats();
      setStats(response.data);
    } catch (error) {
      console.error("Failed to load stats", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await getAllUsers();
      setUsersList(response.data);
    } catch (error) {
      console.error("Failed to load users", error);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
        Loading system data...
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      <aside className="w-64 bg-slate-900 text-white p-6 hidden md:flex md:flex-col shrink-0">
        <h2 className="text-2xl font-bold mb-8 text-blue-400">Admin</h2>
        <nav className="space-y-2 flex-1">
          <button
            onClick={() => setActiveTab("pulse")}
            className={`flex items-center space-x-3 w-full p-3 rounded transition-colors ${activeTab === "pulse" ? "text-blue-400 bg-slate-800" : "text-slate-400 hover:text-white"}`}
          >
            <Activity size={20} /> <span>Platform Pulse</span>
          </button>
          <button
            onClick={() => setActiveTab("financials")}
            className={`flex items-center space-x-3 w-full p-3 rounded transition-colors ${activeTab === "financials" ? "text-blue-400 bg-slate-800" : "text-slate-400 hover:text-white"}`}
          >
            <PieChartIcon size={20} /> <span>Financial Analytics</span>
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center space-x-3 w-full p-3 rounded transition-colors ${activeTab === "users" ? "text-blue-400 bg-slate-800" : "text-slate-400 hover:text-white"}`}
          >
            <Users size={20} /> <span>User Management</span>
          </button>
        </nav>
        <button
          onClick={onLogout}
          className="flex items-center space-x-3 text-red-400 hover:text-red-300 p-3 mt-auto w-full"
        >
          <LogOut size={20} /> <span>Sign Out</span>
        </button>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto min-w-0">
        {activeTab === "pulse" && (
          <div className="space-y-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
              Platform Pulse
            </h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <p className="text-gray-500 text-sm mb-1">Total Users</p>
                <h3 className="text-3xl font-bold text-gray-900">
                  {stats.pulse.totalUsers}
                </h3>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <p className="text-gray-500 text-sm mb-1">
                  DAU (Est. Active Today)
                </p>
                <h3 className="text-3xl font-bold text-blue-600">
                  {stats.pulse.activeUsersToday}
                </h3>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <p className="text-gray-500 text-sm mb-1">Total Transactions</p>
                <h3 className="text-3xl font-bold text-gray-900">
                  {stats.pulse.totalTransactions}
                </h3>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <p className="text-gray-500 text-sm mb-1">New Signups (Week)</p>
                <h3 className="text-3xl font-bold text-green-600">
                  +{stats.pulse.newSignupsWeek}
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-lg shadow-md flex flex-col overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Whale Watch (Top 5 Transactions)
                  </h3>
                </div>
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-4">User</th>
                        <th className="px-6 py-4">Type</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.pulse.whaleTransactions?.length > 0 ? (
                        stats.pulse.whaleTransactions.map((tx) => (
                          <tr
                            key={tx.id}
                            className="border-b border-gray-50 hover:bg-gray-50"
                          >
                            <td className="px-6 py-4">
                              <div className="font-medium text-gray-900">
                                {tx.user}
                              </div>
                              <div className="text-xs text-gray-400">
                                {tx.email}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${tx.type === "Income" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                              >
                                {tx.type}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {new Date(tx.date).toLocaleDateString("en-IN", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-gray-900">
                              {formatCurrency(tx.amount)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="4"
                            className="px-6 py-8 text-center text-gray-500"
                          >
                            No transactions recorded yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md h-auto overflow-hidden flex flex-col">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Recent Activity
                </h3>
                <div className="space-y-4 overflow-y-auto pr-2 max-h-72">
                  {stats.pulse.recentActivity &&
                  stats.pulse.recentActivity.length > 0 ? (
                    stats.pulse.recentActivity.map((activity) => (
                      <div
                        key={activity.id}
                        className="text-sm border-b border-gray-100 pb-3 last:border-0"
                      >
                        <div>
                          <span
                            className={`${activity.color} font-semibold mr-2`}
                          >
                            {activity.type}
                          </span>
                          <span className="text-gray-700">
                            {activity.message}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(activity.time).toLocaleString("en-IN", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">
                      No recent activity found.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "financials" && (
          <div className="space-y-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
              Financial Analytics
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-l-green-500">
                <p className="text-gray-500 text-sm">Platform Income Volume</p>
                <h3
                  className="text-2xl font-bold text-gray-900 truncate"
                  title={stats.financials.totalRevenue}
                >
                  {formatCurrency(stats.financials.totalRevenue)}
                </h3>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-l-red-500">
                <p className="text-gray-500 text-sm">Platform Expense Volume</p>
                <h3
                  className="text-2xl font-bold text-gray-900 truncate"
                  title={stats.financials.totalExpenses}
                >
                  {formatCurrency(stats.financials.totalExpenses)}
                </h3>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <p className="text-gray-500 text-sm">Avg. Expense Size</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.financials.avgExpense)}
                </h3>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <p className="text-gray-500 text-sm">Global Savings Rate</p>
                <h3 className="text-2xl font-bold text-blue-600">
                  {stats.financials.savingsRate?.toFixed(1) || 0}%
                </h3>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-lg text-slate-900 font-semibold mb-6">
                  Cashflow Trends
                </h2>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.financials.cashflowData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#e2e8f0"
                      />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                      <YAxis
                        stroke="#64748b"
                        fontSize={12}
                        tickFormatter={(value) => formatCurrency(`${value}`)}
                        width={80}
                      />
                      <RechartsTooltip
                        formatter={(value) => formatCurrency(value)}
                      />
                      <Line
                        type="monotone"
                        name="Incomes"
                        dataKey="revenue"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        name="Expenses"
                        dataKey="expenses"
                        stroke="#ef4444"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg text-slate-900 font-semibold mb-4">
                    Top Expense Categories
                  </h3>
                  {stats.financials.topExpenseCategories?.length > 0 ? (
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stats.financials.topExpenseCategories}
                            cx="50%"
                            cy="50%"
                            outerRadius={90}
                            dataKey="value"
                            label={false}
                            labelLine={false}
                          >
                            {stats.financials.topExpenseCategories.map(
                              (entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                />
                              ),
                            )}
                          </Pie>
                          <RechartsTooltip
                            formatter={(value, name) => [
                              formatCurrency(`${Number(value).toFixed(2)}`),
                              name,
                            ]}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No data available
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg text-slate-900 font-semibold mb-4">
                    Top Income Sources
                  </h3>
                  {stats.financials.topIncomeCategories?.length > 0 ? (
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stats.financials.topIncomeCategories}
                            cx="50%"
                            cy="50%"
                            outerRadius={90}
                            dataKey="value"
                            label={false}
                            labelLine={false}
                          >
                            {stats.financials.topIncomeCategories.map(
                              (entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                />
                              ),
                            )}
                          </Pie>
                          <RechartsTooltip
                            formatter={(value, name) => [
                              formatCurrency(`${Number(value).toFixed(2)}`),
                              name,
                            ]}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No data available
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="space-y-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
              User Management
            </h1>
            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">
                  Registered Accounts
                </h3>
                <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
                  {usersList.length} Total
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase bg-white border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.length === 0 ? (
                      <tr>
                        <td
                          colSpan="4"
                          className="px-6 py-8 text-center text-gray-500"
                        >
                          Loading users...
                        </td>
                      </tr>
                    ) : (
                      usersList.map((user) => (
                        <tr
                          key={user._id}
                          className="bg-white border-b hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 font-medium text-gray-900">
                            {user.name}
                          </td>
                          <td className="px-6 py-4">{user.email}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"}`}
                            >
                              {user.role || "user"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
