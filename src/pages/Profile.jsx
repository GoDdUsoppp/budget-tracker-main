import React, { useState, useEffect } from "react";
import { User, Settings, Moon, Sun, LogOut, Wallet } from "lucide-react";

export default function Profile() {
  const [user, setUser] = useState({ name: "", email: "", role: "" });
  const [isDark, setIsDark] = useState(false);
  const [currency, setCurrency] = useState("INR");

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    setUser(storedUser);

    const savedTheme = localStorage.getItem("theme");
    setIsDark(savedTheme === "dark");

    const savedCurrency = localStorage.getItem("currency") || "INR";
    setCurrency(savedCurrency);
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDark(true);
    }
  };

  const handleCurrencyChange = (e) => {
    const newCurrency = e.target.value;
    setCurrency(newCurrency);
    localStorage.setItem("currency", newCurrency);
    window.location.reload();
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      localStorage.removeItem("user");
      localStorage.removeItem("userRole");
      window.location.href = "/login";
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-gray-900 dark:text-gray-100">
      <h1 className="text-3xl font-bold mb-8">Profile & Settings</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full flex items-center justify-center mb-4">
              <User size={48} />
            </div>
            <h2 className="text-xl font-semibold">{user.name || "User"}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
              {user.email}
            </p>
            <span className="bg-blue-50 dark:bg-slate-700 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-medium uppercase">
              {user.role || "Standard User"}
            </span>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Settings className="mr-2" size={20} /> App Preferences
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                <div>
                  <p className="font-medium">Theme</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Switch between light and dark mode
                  </p>
                </div>
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors"
                >
                  {isDark ? (
                    <Sun size={20} className="text-yellow-400" />
                  ) : (
                    <Moon size={20} className="text-slate-700" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                <div>
                  <p className="font-medium">Default Currency</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Used for all charts and statements
                  </p>
                </div>
                <div className="relative">
                  <select
                    value={currency}
                    onChange={handleCurrencyChange}
                    className="appearance-none bg-white dark:bg-slate-600 border border-gray-200 dark:border-slate-500 text-gray-700 dark:text-gray-100 py-2 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="INR">₹ INR (Indian Rupee)</option>
                    <option value="USD">$ USD (US Dollar)</option>
                    <option value="EUR">€ EUR (Euro)</option>
                    <option value="GBP">£ GBP (British Pound)</option>
                  </select>
                  <Wallet
                    className="absolute right-3 top-2.5 text-gray-400 pointer-events-none"
                    size={16}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-red-100 dark:border-red-900/30">
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4 flex items-center">
              Account Actions
            </h3>
            <button
              onClick={handleLogout}
              className="flex items-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 px-4 py-2 rounded-lg transition-colors w-full sm:w-auto"
            >
              <LogOut size={18} className="mr-2" /> Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
