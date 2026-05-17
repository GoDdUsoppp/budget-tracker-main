import React, { useState, useEffect, useRef } from "react";
import { NavLink, Outlet, Link } from "react-router-dom";
import {
  User,
  MoreVertical,
  Moon,
  Sun,
  Wallet,
  LogOut as LogOutIcon,
} from "lucide-react";

const DashboardLayout = ({ children, onLogout }) => {
  const user = JSON.parse(localStorage.getItem("user"));

  const [showMenu, setShowMenu] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [currency, setCurrency] = useState("INR");
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setIsDark(localStorage.getItem("theme") === "dark");
    setCurrency(localStorage.getItem("currency") || "INR");
  }, []);

  const toggleTheme = () => {
    const newTheme = isDark ? "light" : "dark";
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", newTheme);
    setIsDark(!isDark);
  };

  const handleCurrencyChange = (e) => {
    const newCurrency = e.target.value;
    setCurrency(newCurrency);
    localStorage.setItem("currency", newCurrency);
    window.location.reload();
  };

  return (
    <div className="max-w-7xl mx-auto p-6 text-gray-900 dark:text-gray-100">
      <div className="mb-8 flex justify-between items-start relative">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Finance Tracker
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and track your finances
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Welcome,{" "}
            </p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {user?.name || "User"}
            </p>
          </div>

          <Link
            to="/profile"
            className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 dark:bg-slate-800 dark:text-blue-400 dark:hover:bg-slate-700 transition-colors"
            title="Profile"
          >
            <User size={20} />
          </Link>

          <div ref={menuRef} className="relative z-50">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors dark:text-gray-300 dark:hover:bg-slate-800"
            >
              <MoreVertical size={20} />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-slate-700">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Quick Settings
                  </p>

                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm flex items-center text-gray-700 dark:text-gray-200">
                      {isDark ? (
                        <Moon size={16} className="mr-2" />
                      ) : (
                        <Sun size={16} className="mr-2" />
                      )}
                      Dark Mode
                    </span>
                    <button
                      onClick={toggleTheme}
                      className={`w-10 h-5 rounded-full relative transition-colors ${isDark ? "bg-blue-500" : "bg-gray-300 dark:bg-slate-600"}`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${isDark ? "translate-x-5" : ""}`}
                      ></span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center text-gray-700 dark:text-gray-200">
                      <Wallet size={16} className="mr-2" />
                      Currency
                    </span>
                    <select
                      value={currency}
                      onChange={handleCurrencyChange}
                      className="text-xs border border-gray-200 rounded p-1 dark:bg-slate-700 dark:border-slate-600 dark:text-white cursor-pointer focus:outline-none"
                    >
                      <option value="INR">₹ INR</option>
                      <option value="USD">$ USD</option>
                      <option value="EUR">€ EUR</option>
                      <option value="GBP">£ GBP</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center transition-colors"
                >
                  <LogOutIcon size={16} className="mr-2" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200 dark:border-slate-700 mb-6">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {[
            { path: "/", label: "Overview", exact: true },
            { path: "/expenses", label: "Expenses" },
            { path: "/income", label: "Income" },
            { path: "/accounts", label: "Accounts" },
            { path: "/groups", label: "Groups" },
            { path: "/statement", label: "Statement" },
            { path: "/insights", label: "Insights" },
          ].map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) =>
                `py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  isActive
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-slate-500"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-gray-100 dark:border-slate-700">
        <Outlet />
      </div>
    </div>
  );
};

export default DashboardLayout;
