const BASE_URL = "http://localhost:3001/api/income";

export const getIncome = async (userId) => {
  const response = await fetch(`/api/income?userId=${userId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch income");
  }

  return response.json();
};

export const createIncome = async (data) => {
  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to create income");
  }

  return response.json();
};

export const deleteIncome = async (id) => {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete income");
  }
};