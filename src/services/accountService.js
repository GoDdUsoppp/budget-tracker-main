const BASE_URL = "http://localhost:3001/api/accounts";

export const getAccounts = async (userId) => {
   const response = await fetch(`/api/accounts?userId=${userId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch accounts");
  }

  return response.json()
};

export const createAccount = async (data) => {
  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to create account");
  }

  return response.json();
};

export const deleteAccount = async (id) => {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete account");
  }
};