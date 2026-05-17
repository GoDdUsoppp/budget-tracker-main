import { useEffect, useState } from "react";
import {
  getAccounts,
  createAccount,
  deleteAccount,
} from "../services/accountService";
import { formatCurrency } from "../utils/currency";

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [success, setSuccess] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [actionType, setActionType] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({
    type: "bank",
    alias: "",
    accountNumberLast4: "",
    balance: "",
  });

  const loadAccounts = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const data = await getAccounts(user.id);
    setAccounts(data);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteAccount(deleteTarget._id);
    setDeleteTarget(null);
    await loadAccounts();
    setActionType("delete");
    setSuccess(true);
  };

  const startEdit = (acc) => {
    setEditingAccount(acc);
    setForm({
      type: acc.type,
      alias: acc.alias || "",
      accountNumberLast4: acc.accountNumberLast4 || "",
      balance: acc.balance,
    });
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedAlias = form.alias.trim();
    if (!form.balance) {
      alert("Starting balance is required.");
      return;
    }

    if (editingAccount) {
      const payload = {
        alias: trimmedAlias,
        accountNumberLast4: form.accountNumberLast4,
      };
      const response = await fetch(
        `http://localhost:3001/api/accounts/${editingAccount._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!response.ok) {
        alert("Failed to update account");
        return;
      }
      setActionType("update");
      setForm({ type: "bank", alias: "", accountNumberLast4: "", balance: "" });
      setEditingAccount(null);
      await loadAccounts();
      setSuccess(true);
      return;
    }

    const user = JSON.parse(localStorage.getItem("user"));
    let payload = {
      type: form.type,
      balance: Number(form.balance),
      userId: user.id,
    };

    if (form.type === "bank") {
      if (!trimmedAlias) {
        alert("Alias cannot be empty.");
        return;
      }
      if (!/^\d{4}$/.test(form.accountNumberLast4)) {
        alert("Last 4 digits must be exactly 4 numbers.");
        return;
      }
      payload.alias = trimmedAlias;
      payload.accountNumberLast4 = form.accountNumberLast4;
    }
    setActionType("create");
    await createAccount(payload);
    setForm({ type: "bank", alias: "", accountNumberLast4: "", balance: "" });
    loadAccounts();
    setSuccess(true);
  };

  const inputClasses =
    "w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="space-y-8 text-gray-900 dark:text-gray-100">
      {success && (
        <div className="bg-green-600 text-white px-5 py-3 rounded-lg shadow-lg">
          {actionType === "update"
            ? "Account updated successfully"
            : actionType === "delete"
              ? "Account deleted successfully"
              : "Account added successfully"}
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border border-gray-100 dark:border-slate-700">
        <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
          {editingAccount ? "Edit Account" : "Add Account"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Account Type
              </label>
              <select
                className={inputClasses}
                value={form.type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    type: e.target.value,
                    alias: "",
                    accountNumberLast4: "",
                  })
                }
              >
                <option value="bank">Bank</option>
                <option value="cash">Cash</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Starting Balance
              </label>
              <input
                type="text"
                disabled={editingAccount}
                inputMode="decimal"
                className={inputClasses}
                value={form.balance}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^\d*\.?\d*$/.test(value)) {
                    setForm({ ...form, balance: value });
                  }
                }}
                required
              />
            </div>
          </div>

          {form.type === "bank" && (
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Alias
                </label>
                <input
                  className={inputClasses}
                  value={form.alias}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      alias: e.target.value.replace(/^\s+/, ""),
                    })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Last 4 Digits
                </label>
                <input
                  className={inputClasses}
                  maxLength="4"
                  value={form.accountNumberLast4}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    setForm({ ...form, accountNumberLast4: value });
                  }}
                  required
                />
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 text-sm rounded transition-colors"
            >
              {editingAccount ? "Update Account" : "Add Account"}
            </button>
            {editingAccount && (
              <button
                type="button"
                onClick={() => {
                  setEditingAccount(null);
                  setForm({
                    type: "bank",
                    alias: "",
                    accountNumberLast4: "",
                    balance: "",
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

      <div>
        <h3 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
          Account List
        </h3>
        {accounts.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-400 text-sm bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-100 dark:border-slate-700">
            No accounts added yet.
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700 divide-y divide-gray-100 dark:divide-slate-700">
            {accounts
              .filter((account) => !account.isArchived)
              .map((acc) => (
                <div
                  key={acc._id}
                  className="flex justify-between items-center px-6 py-4 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors"
                >
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {acc.type === "cash"
                        ? "Cash"
                        : `${acc.alias} (****${acc.accountNumberLast4})`}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 capitalize">
                      {acc.type} account
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(acc.balance)}
                    </div>
                    <div className="flex gap-3 justify-end text-xs">
                      <button
                        onClick={() => startEdit(acc)}
                        className="text-blue-500 hover:text-blue-400 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(acc)}
                        className="text-red-500 hover:text-red-400 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-sm border border-gray-100 dark:border-slate-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Delete [ {deleteTarget.alias || "Cash"} ] Account
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete this account?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm transition-colors"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
