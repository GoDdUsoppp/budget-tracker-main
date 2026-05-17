import { useEffect, useState } from "react";
import StatsCards from "../components/StatsCards";
import ExpenseCharts from "../components/ExpenseCharts";

export default function Overview() {

  const [expenses, setExpenses] = useState([]);
  const [income, setIncome] = useState([]);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  

  const fetchData = async () => {

    try {

      const user = JSON.parse(localStorage.getItem("user"));

      const [expenseRes, incomeRes, categoryRes, accountRes] = await Promise.all([
        fetch(`/api/expenses?userId=${user.id}`),
        fetch(`/api/income?userId=${user.id}`),
        fetch("http://localhost:3001/api/categories"),
        fetch(`/api/accounts?userId=${user.id}`)
      ]);

      const expensesData = await expenseRes.json();
      const incomeData = await incomeRes.json();
      const categoriesData = await categoryRes.json();
      const accountsData = await accountRes.json();

      setExpenses(expensesData);
      setIncome(incomeData);
      setCategories(categoriesData);
      setAccounts(accountsData);

    } catch (err) {

      console.error("Failed to load overview data");

    }

  };

  useEffect(() => {
    fetchData();
  }, []);

  return (

    <div className="space-y-6">

      <StatsCards
        expenses={expenses}
        income={income}
        categories={categories}
        accounts={accounts}
      />

      <ExpenseCharts
        expenses={expenses}
        categories={categories}
        income={income}
      />
    
    </div>

  );

}