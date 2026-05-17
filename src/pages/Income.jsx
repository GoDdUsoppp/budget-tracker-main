import { useEffect, useState } from "react";
import { getIncome, createIncome } from "../services/incomeService";
import { getAccounts } from "../services/accountService";
import { formatCurrency } from "../utils/currency";
import { useLocation, useNavigate } from "react-router-dom";

export default function IncomePage() {
  const [income, setIncome] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [editingIncome, setEditingIncome] = useState(null);
  const [success, setSuccess] = useState(false);
  const [warning, setWarning] = useState(null);
  const [actionType, setActionType] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [claimingExpenseId, setClaimingExpenseId] = useState(null);
  const [claimingUserId, setClaimingUserId] = useState(null);

  const [form, setForm] = useState({
    note: "",
    description: "",
    amount: "",
    category: "",
    account: "",
    date: new Date().toISOString().split("T")[0],
  });

  const loadIncome = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const data = await getIncome(user.id);
    setIncome(data);
  };

  const loadAccounts = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const data = await getAccounts(user.id);
    setAccounts(data);
  };

  useEffect(() => {
    loadIncome();
    loadAccounts();
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (location.state?.claimIncome) {
      const claim = location.state.claimIncome;

      setForm((prevForm) => ({
        ...prevForm,
        amount: claim.amount.toString(),
        note: claim.note,
      }));

      setClaimingExpenseId(claim.expenseId);
      setClaimingUserId(claim.userId);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedNote = form.note.trim();
    const trimmedDescription = form.description.trim();

    if (!trimmedNote) {
      alert("Note cannot be empty.");
      return;
    }

    if (editingIncome) {
      await updateIncome({ ...form, id: editingIncome._id });
      return;
    }

    const user = JSON.parse(localStorage.getItem("user"));

    await createIncome({
      ...form,
      note: trimmedNote,
      description: trimmedDescription,
      amount: Number(form.amount),
      userId: user.id,
      claimingExpenseId: claimingExpenseId,
      claimingUserId: claimingUserId,
    });

    setForm({
      note: "",
      description: "",
      amount: "",
      category: "",
      account: "",
      date: new Date().toISOString().split("T")[0],
    });

    setClaimingExpenseId(null);
    setClaimingUserId(null);

    loadIncome();
    setActionType(claimingExpenseId ? "claim" : "create");
    setSuccess(true);

    if (claimingExpenseId) {
      setTimeout(() => navigate("/groups"), 1500);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const url =
      deleteTarget.type === "expense"
        ? `http://localhost:3001/api/expenses/${deleteTarget.id}`
        : `http://localhost:3001/api/income/${deleteTarget.id}`;
    const res = await fetch(url, { method: "DELETE" });
    const data = await res.json();

    if (!res.ok && data.warning) {
      setDeleteTarget(null);
      setWarning({
        income: { ...deleteTarget, _id: deleteTarget.id },
        ...data,
      });
      return;
    }

    await loadIncome();
    setDeleteTarget(null);
    setActionType("delete");
    setSuccess(true);
  };

  const updateIncome = async (data) => {
    const res = await fetch(`http://localhost:3001/api/income/${data.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        note: data.note.trim(),
        description: data.description,
        amount: Number(data.amount),
        category: data.category,
        account: data.account,
        date: data.date,
      }),
    });
    const result = await res.json();

    if (!res.ok && result.warning) {
      setWarning({
        income: { ...data, _id: data.id },
        ...result,
        updateMode: true,
      });
      return;
    }

    setEditingIncome(null);
    setForm({
      note: "",
      description: "",
      amount: "",
      category: "",
      account: "",
      date: new Date().toISOString().split("T")[0],
    });
    loadIncome();
    setActionType("update");
    setSuccess(true);
  };

  const inputClasses =
    "w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="space-y-8 text-gray-900 dark:text-gray-100">
      {success && (
        <div className="bg-green-600 text-white px-5 py-3 rounded-lg shadow-lg">
          {actionType === "create"
            ? "Income added successfully"
            : actionType === "update"
              ? "Income updated successfully"
              : "Income deleted successfully"}
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border border-gray-100 dark:border-slate-700">
        <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
          {editingIncome ? "Edit Income" : "Add Income"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="decimal"
                className={inputClasses}
                value={form.amount}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^\d*\.?\d*$/.test(value)) {
                    setForm({ ...form, amount: value });
                  }
                }}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                className={inputClasses}
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                required
              >
                <option value="">Select Category</option>
                <option value="salary">Salary</option>
                <option value="freelance">Freelance</option>
                <option value="business">Business</option>
                <option value="investment">Investment</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Account <span className="text-red-500">*</span>
              </label>
              <select
                className={inputClasses}
                value={form.account}
                onChange={(e) => setForm({ ...form, account: e.target.value })}
                required
              >
                <option value="">Select Account</option>
                {accounts
                  .filter((account) => !account.isArchived)
                  .map((acc) => (
                    <option key={acc._id} value={acc._id}>
                      {acc.type === "cash"
                        ? "Cash"
                        : `${acc.alias} (****${acc.accountNumberLast4})`}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className={inputClasses}
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Note <span className="text-red-500">*</span>
            </label>
            <input
              className={inputClasses}
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              rows="3"
              className={inputClasses}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 text-sm rounded transition-colors"
            >
              {editingIncome ? "Update Income" : "Add Income"}
            </button>
            {editingIncome && (
              <button
                type="button"
                onClick={() => {
                  setEditingIncome(null);
                  setForm({
                    note: "",
                    description: "",
                    amount: "",
                    category: "",
                    account: "",
                    date: new Date().toISOString().split("T")[0],
                  });
                }}
                className="ml-3 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
        <h3 className="text-lg font-semibold p-6 text-gray-900 dark:text-white">
          Income History
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-700/50 text-left text-gray-600 dark:text-gray-300">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Note</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 dark:text-gray-200">
              {income.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="text-center text-gray-500 dark:text-gray-400 py-6"
                  >
                    No income recorded yet
                  </td>
                </tr>
              ) : (
                income.map((item) => (
                  <tr
                    key={item._id}
                    className="border-t border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      {new Date(item.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {item.note?.length > 20
                        ? item.note.slice(0, 20) + "..."
                        : item.note}
                    </td>
                    <td className="px-4 py-3 text-right text-green-500 font-medium">
                      +{formatCurrency(item.amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => {
                          setEditingIncome(item);
                          setForm({
                            note: item.note,
                            description: item.description || "",
                            amount: item.amount,
                            category: item.category,
                            account: item.account?._id || item.account,
                            date: item.date.slice(0, 10),
                          });
                        }}
                        className="text-blue-500 hover:text-blue-400 mr-3 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() =>
                          setDeleteTarget({
                            type: "income",
                            id: item._id,
                            note: item.note,
                          })
                        }
                        className="text-red-500 hover:text-red-400 transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(warning || deleteTarget) && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-sm border border-gray-100 dark:border-slate-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              {warning ? "Balance Warning" : "Confirm Delete"}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              {warning ? (
                <>
                  {warning.updateMode
                    ? "Updating this income will make the account balance negative."
                    : "Deleting this income will make the account balance negative."}
                  <br />
                  <br />
                  Current: {formatCurrency(warning.currentBalance)}
                  <br />
                  After: {formatCurrency(warning.newBalance)}
                </>
              ) : (
                <>
                  Are you sure you want to delete:
                  <br />
                  <strong className="text-gray-900 dark:text-white mt-2 block">
                    {deleteTarget.note}
                  </strong>
                </>
              )}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() =>
                  warning ? setWarning(null) : setDeleteTarget(null)
                }
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (warning && warning?.income?._id) {
                    if (warning.updateMode) {
                      await fetch(
                        `http://localhost:3001/api/income/${warning.income._id}?force=true`,
                        {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            note: warning.income.note.trim(),
                            description: warning.income.description,
                            amount: Number(warning.income.amount),
                            category: warning.income.category,
                            account: warning.income.account,
                            date: warning.income.date,
                          }),
                        },
                      );
                    } else {
                      await fetch(
                        `http://localhost:3001/api/income/${warning.income._id}?force=true`,
                        { method: "DELETE" },
                      );
                    }
                    setWarning(null);
                    setEditingIncome(null);
                    setForm({
                      note: "",
                      description: "",
                      amount: "",
                      category: "",
                      account: "",
                      date: new Date().toISOString().split("T")[0],
                    });
                    loadIncome();
                    setActionType(warning.updateMode ? "update" : "delete");
                    setSuccess(true);
                  } else {
                    confirmDelete();
                  }
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm transition-colors"
              >
                {warning
                  ? warning.updateMode
                    ? "Update Anyway"
                    : "Delete Anyway"
                  : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
