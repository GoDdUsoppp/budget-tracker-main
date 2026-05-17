import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import DashboardLayout from "./components/DashboardLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Overview from "./pages/Overview";
import Expenses from "./pages/Expenses";
import Accounts from "./pages/Accounts";
import Income from "./pages/Income";
import Statement from "./pages/Statement";
import Insights from "./pages/Insights";
import AdminDashboard from "./pages/AdminDashboard";
import Profile from "./pages/Profile";
import Groups from "./pages/Group";
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState("user");

  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn");
    const role = localStorage.getItem("userRole");
    if (loggedIn === "true") {
      setIsLoggedIn(true);
      setUserRole(role || "user");
    }

    if (localStorage.getItem("theme") === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const handleLogin = (role) => {
    setIsLoggedIn(true);
    setUserRole(role);
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("userRole", role);
  };

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userRole");
    setIsLoggedIn(false);
    setUserRole("user");
  };

  return (
    <Routes>
      {!isLoggedIn && (
        <>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </>
      )}

      {isLoggedIn && userRole === "admin" && (
        <Route
          path="/admin/*"
          element={<AdminDashboard onLogout={handleLogout} />}
        />
      )}

      {isLoggedIn && userRole === "user" && (
        <Route path="/" element={<DashboardLayout onLogout={handleLogout} />}>
          <Route index element={<Overview />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="income" element={<Income />} />
          <Route path="accounts" element={<Accounts />} />
          <Route path="statement" element={<Statement />} />
          <Route path="insights" element={<Insights />} />
          <Route path="groups" element={<Groups />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Route>
      )}

      {isLoggedIn && (
        <Route
          path="*"
          element={<Navigate to={userRole === "admin" ? "/admin" : "/"} />}
        />
      )}
    </Routes>
  );
}

export default App;
