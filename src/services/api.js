import axios from "axios";
const getUserId = () => {
  const userStr = localStorage.getItem("user");
  if (userStr) {
    const user = JSON.parse(userStr);
    return user.id;
  }
  return null;
};

export const getAdminStats = () => {
  return axios.get("/api/admin/stats", {
    headers: {
      "x-user-id": getUserId()
    }
  });
};
export const getAllUsers = () => {
  return axios.get("/api/admin/users", {
    headers: {
      "x-user-id": getUserId()
    }
  });
};

export const deleteUser = (userId) => {
  return axios.delete(`/api/admin/users/${userId}`, {
    headers: {
      "x-user-id": getUserId()
    }
  });
};

export const getExpenses = () => axios.get("/api/expenses");
export const addExpense = (expense) => axios.post("/api/expenses", expense);

export const getCategories = () => axios.get("/api/categories");
export const addCategory = (category) => axios.post("/api/categories", category);
