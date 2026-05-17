import { formatCurrency } from "../utils/currency";

const StatsCards = ({ expenses, income, categories, accounts }) => {
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const now = new Date();

  const monthExpenses = expenses
    .filter((e) => {
      const d = new Date(e.date);
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, e) => sum + e.amount, 0);

  const monthIncome = income
    .filter((i) => {
      const d = new Date(i.date);
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, i) => sum + i.amount, 0);

  const netSavings = monthIncome - monthExpenses;

  const stats = [
    {
      title: "Total Balance",
      value: formatCurrency(totalBalance),
      icon: "💳",
      color: "bg-blue-500",
    },
    {
      title: "This Month Income",
      value: formatCurrency(monthIncome),
      icon: "📈",
      color: "bg-green-500",
    },
    {
      title: "This Month Expense",
      value: formatCurrency(monthExpenses),
      icon: "📉",
      color: "bg-red-500",
    },
    {
      title: "Net Savings",
      value: formatCurrency(netSavings),
      icon: "🏦",
      color: "bg-purple-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-100 dark:border-slate-700 p-6 transition-colors"
        >
          <div className="flex items-center">
            <div className={`${stat.color} rounded-lg p-3 mr-4`}>
              <span className="text-2xl">{stat.icon}</span>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {stat.title}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stat.value}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
export default StatsCards;
