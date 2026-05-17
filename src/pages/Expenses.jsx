import { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { formatCurrency } from "../utils/currency";

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [groups, setGroups] = useState([]);

  const [editingExpense, setEditingExpense] = useState(null);
  const [warning, setWarning] = useState(null);

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [categoryId, setCategoryId] = useState("");
  const [account, setAccount] = useState("");
  const [groupId, setGroupId] = useState("");

  const [splitAmounts, setSplitAmounts] = useState({});
  const [splitMode, setSplitMode] = useState("equal");
  const [customSplits, setCustomSplits] = useState({});

  const [settlingDebtId, setSettlingDebtId] = useState(null);
  const [optimizedPayeeId, setOptimizedPayeeId] = useState(null);

  const [success, setSuccess] = useState(false);
  const [actionType, setActionType] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem("user"));
  const location = useLocation();
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    try {
      const [expenseRes, categoryRes, accountRes, groupRes] = await Promise.all(
        [
          fetch(`http://localhost:3001/api/expenses?userId=${currentUser.id}`),
          fetch("http://localhost:3001/api/categories"),
          fetch(`http://localhost:3001/api/accounts?userId=${currentUser.id}`),
          fetch(`http://localhost:3001/api/groups/user/${currentUser.id}`),
        ],
      );

      setExpenses(await expenseRes.json());
      setCategories(await categoryRes.json());
      setAccounts(await accountRes.json());
      setGroups(await groupRes.json());
    } catch (err) {
      console.error("Failed to fetch data:", err);
    }
  }, [currentUser.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (location.state?.settleDebt) {
      const debt = location.state.settleDebt;
      setAmount(debt.amount.toString());
      setNote(debt.note);
      setGroupId(debt.groupId);
      setSettlingDebtId(debt.expenseId);
      window.history.replaceState({}, document.title);
    } else if (location.state?.settleOptimized) {
      const opt = location.state.settleOptimized;
      setAmount(opt.amount.toString());
      setNote(`Bulk settlement to ${opt.toName}`);
      setGroupId(opt.groupId);
      setOptimizedPayeeId(opt.toId);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (!groupId || !amount || settlingDebtId) {
      setSplitAmounts({});
      return;
    }

    const group = groups.find((g) => g._id === groupId);
    if (!group || group.members.length === 0) return;

    const totalAmount = Number(amount);
    const newSplits = {};

    if (splitMode === "equal") {
      const equalShare = (totalAmount / group.members.length).toFixed(2);
      group.members.forEach((member) => {
        newSplits[member._id] = member._id === currentUser.id ? 0 : equalShare;
      });
      setSplitAmounts(newSplits);
    } else if (splitMode === "amount") {
      group.members.forEach((member) => {
        newSplits[member._id] =
          member._id === currentUser.id
            ? 0
            : Number(customSplits[member._id] || 0);
      });
      setSplitAmounts(newSplits);
    } else if (splitMode === "ratio") {
      let totalRatio = 0;
      group.members.forEach(
        (m) => (totalRatio += Number(customSplits[m._id] || 0)),
      );

      group.members.forEach((member) => {
        if (totalRatio === 0) {
          newSplits[member._id] = 0;
        } else {
          const ratio = Number(customSplits[member._id] || 0);
          newSplits[member._id] =
            member._id === currentUser.id
              ? 0
              : ((totalAmount * ratio) / totalRatio).toFixed(2);
        }
      });
      setSplitAmounts(newSplits);
    }
  }, [
    groupId,
    amount,
    groups,
    currentUser.id,
    settlingDebtId,
    splitMode,
    customSplits,
  ]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !note.trim() || !date || !categoryId || !account) {
      alert("Please fill all required fields");
      return;
    }

    const splitDetails = Object.keys(splitAmounts)
      .map((userId) => ({
        user: userId,
        amountOwed: Number(splitAmounts[userId]),
        hasPaid: false,
      }))
      .filter((split) => split.amountOwed > 0);

    const payload = {
      amount: Number(amount),
      note: note.trim(),
      description: description.trim(),
      date,
      categoryId,
      account,
      userId: currentUser.id,
      groupId: groupId || null,
      splitDetails,
      settlingDebtId,
      optimizedPayeeId,
    };

    try {
      const url = editingExpense
        ? `http://localhost:3001/api/expenses/${editingExpense}`
        : "http://localhost:3001/api/expenses";
      const method = editingExpense ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok && result.warning) {
        setWarning({ expense: payload, ...result });
        return;
      }
      if (!response.ok) throw new Error(result.error || "Failed to save");

      await fetchData();
      setActionType(
        editingExpense
          ? "update"
          : settlingDebtId || optimizedPayeeId
            ? "settle"
            : "create",
      );
      setSuccess(true);

      setEditingExpense(null);
      setSettlingDebtId(null);
      setOptimizedPayeeId(null);
      setAmount("");
      setNote("");
      setDescription("");
      setCategoryId("");
      setAccount("");
      setGroupId("");
      setDate(new Date().toISOString().split("T")[0]);
      setSplitAmounts({});
      setCustomSplits({});
      setSplitMode("equal");

      if (settlingDebtId || optimizedPayeeId)
        setTimeout(() => navigate("/groups"), 1500);
    } catch (err) {
      alert(err.message);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const url = `http://localhost:3001/api/expenses/${deleteTarget.id}`;
    const res = await fetch(url, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok && data.warning) {
      setWarning({ ...data, deleteTarget });
      return;
    }
    await fetchData();
    setDeleteTarget(null);
  };

  const inputClasses =
    "w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="space-y-8">
      {success && (
        <div className="bg-green-600 text-white px-5 py-3 rounded-lg shadow-lg">
          {actionType === "create" && "Expense added successfully"}
          {actionType === "update" && "Expense updated successfully"}
          {actionType === "delete" && "Expense deleted successfully"}
          {actionType === "settle" && "Debt settled! Redirecting..."}
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border border-gray-100 dark:border-slate-700">
        <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
          {settlingDebtId || optimizedPayeeId
            ? "Settle Group Debt"
            : editingExpense
              ? "Edit Expense"
              : "Add Expense"}
        </h2>

        {(settlingDebtId || optimizedPayeeId) && (
          <div className="mb-6 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 p-4 rounded-lg border border-blue-200 dark:border-blue-800 text-sm">
            You are logging a payment to settle: <strong>{note}</strong>. This
            will deduct the funds from your selected account.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                disabled={!!(settlingDebtId || optimizedPayeeId)}
                value={amount}
                onChange={(e) => {
                  if (/^\d*\.?\d*$/.test(e.target.value))
                    setAmount(e.target.value);
                }}
                className={inputClasses}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className={inputClasses}
                required
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Debit From Account <span className="text-red-500">*</span>
              </label>
              <select
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                className={inputClasses}
                required
              >
                <option value="">Select account</option>
                {accounts
                  .filter((account) => !account.isArchived)
                  .map((acc) => (
                    <option key={acc._id} value={acc._id}>
                      {acc.type === "cash" ? "Cash" : `${acc.alias}`}
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
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputClasses}
                required
              />
            </div>
          </div>

          {!(settlingDebtId || optimizedPayeeId) && (
            <div className="bg-gray-50 dark:bg-slate-700/30 p-4 rounded-lg border border-gray-100 dark:border-slate-600">
              <label className="block text-sm font-semibold mb-2 text-gray-900 dark:text-white">
                Is this a Shared Group Expense?
              </label>
              <select
                value={groupId}
                onChange={(e) => {
                  setGroupId(e.target.value);
                  setSplitMode("equal");
                  setCustomSplits({});
                }}
                className={inputClasses}
              >
                <option value="">No, Personal Expense</option>
                {groups.map((g) => (
                  <option key={g._id} value={g._id}>
                    {g.name}
                  </option>
                ))}
              </select>

              {groupId && groups.find((g) => g._id === groupId) && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-600">
                  <div className="flex gap-2 mb-4">
                    {["equal", "amount", "ratio"].map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => {
                          setSplitMode(mode);
                          setCustomSplits({});
                        }}
                        className={`px-4 py-1.5 text-xs font-medium rounded transition-colors ${splitMode === mode ? "bg-blue-600 text-white shadow-sm" : "bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-slate-500"}`}
                      >
                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {splitMode === "equal" &&
                        "Split equally among all members"}
                      {splitMode === "amount" &&
                        "Enter the exact amount each person owes you"}
                      {splitMode === "ratio" &&
                        "Enter ratios (e.g., 2 shares for you, 1 for them)"}
                    </p>

                    {groups
                      .find((g) => g._id === groupId)
                      .members.map((member) => {
                        const isCreator = member._id === currentUser.id;

                        if (isCreator && splitMode === "amount") return null;

                        return (
                          <div
                            key={member._id}
                            className="flex justify-between items-center gap-4"
                          >
                            <span className="text-sm text-gray-600 dark:text-gray-300 flex-1">
                              {member.name}{" "}
                              {isCreator
                                ? "(You)"
                                : splitMode === "amount"
                                  ? "owes you:"
                                  : "'s share:"}
                            </span>

                            {splitMode === "equal" ? (
                              !isCreator && (
                                <span className="font-medium text-gray-900 dark:text-white w-32 text-right">
                                  {formatCurrency(splitAmounts[member._id])}
                                </span>
                              )
                            ) : (
                              <div className="flex items-center gap-2 justify-end w-48">
                                <input
                                  type="number"
                                  step={splitMode === "amount" ? "0.01" : "1"}
                                  placeholder={
                                    splitMode === "ratio" ? "Ratio" : "Amount"
                                  }
                                  value={customSplits[member._id] || ""}
                                  onChange={(e) =>
                                    setCustomSplits((prev) => ({
                                      ...prev,
                                      [member._id]: e.target.value,
                                    }))
                                  }
                                  className="w-24 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                {!isCreator && splitMode === "ratio" && (
                                  <span
                                    className="text-xs text-gray-500 w-16 text-right truncate"
                                    title={splitAmounts[member._id]}
                                  >
                                    ={" "}
                                    {formatCurrency(
                                      splitAmounts[member._id] || 0,
                                    )}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Note <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              disabled={!!(settlingDebtId || optimizedPayeeId)}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={inputClasses}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
              className={inputClasses}
              placeholder="Add any extra details here..."
            />
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 text-sm rounded transition-colors"
            >
              {settlingDebtId || optimizedPayeeId
                ? "Confirm Payment"
                : editingExpense
                  ? "Update Expense"
                  : "Add Expense"}
            </button>
            {(editingExpense || settlingDebtId || optimizedPayeeId) && (
              <button
                type="button"
                onClick={() => {
                  setEditingExpense(null);
                  setSettlingDebtId(null);
                  setOptimizedPayeeId(null);
                  setAmount("");
                  setNote("");
                  setDescription("");
                  setCategoryId("");
                  setAccount("");
                  setGroupId("");
                  setDate(new Date().toISOString().split("T")[0]);
                  setSplitAmounts({});
                  setCustomSplits({});
                  setSplitMode("equal");
                }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
        <h3 className="text-lg font-semibold p-6 text-gray-900 dark:text-white">
          Expense History
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-700/50 text-left text-gray-600 dark:text-gray-300">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Note</th>
                <th className="px-4 py-3">Group</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 dark:text-gray-200">
              {expenses.map((exp) => {
                const groupDetails = groups.find(
                  (g) => g._id === (exp.groupId?._id || exp.groupId),
                );

                return (
                  <tr
                    key={exp._id}
                    className="border-t border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      {new Date(exp.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {exp.note?.length > 25
                        ? exp.note.slice(0, 25) + "..."
                        : exp.note}
                    </td>

                    <td className="px-4 py-3">
                      {groupDetails ? (
                        <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-xs font-medium">
                          {groupDetails.name}
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500 text-xs">
                          Personal
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right text-red-500 font-medium">
                      -{formatCurrency(exp.amount)}
                    </td>
                    <td className="px-4 py-3 text-center flex justify-center gap-3">
                      <button
                        onClick={() => {
                          setEditingExpense(exp._id);
                          setAmount(exp.amount);
                          setNote(exp.note);
                          setDescription(exp.description || "");
                          setDate(exp.date.slice(0, 10));
                          setCategoryId(exp.categoryId?._id || exp.categoryId);
                          setAccount(exp.account?._id || exp.account);
                          setGroupId(exp.groupId?._id || exp.groupId || "");

                          if (exp.groupId) {
                            setSplitMode("amount");
                            const prev = {};
                            exp.splitDetails?.forEach((s) => {
                              prev[s.user?._id || s.user] = s.amountOwed;
                            });
                            setCustomSplits(prev);
                          }

                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="text-blue-500 hover:text-blue-400 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() =>
                          setDeleteTarget({ id: exp._id, note: exp.note })
                        }
                        className="text-red-500 hover:text-red-400 transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
              {expenses.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="px-4 py-6 text-center text-gray-500 dark:text-gray-400"
                  >
                    No expenses found.
                  </td>
                </tr>
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
                  This expense will make the account balance negative.
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
                  if (warning) {
                    const url = editingExpense
                      ? `http://localhost:3001/api/expenses/${editingExpense}?force=true`
                      : "http://localhost:3001/api/expenses?force=true";
                    await fetch(url, {
                      method: editingExpense ? "PUT" : "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(warning.expense),
                    });
                    setWarning(null);
                    await fetchData();
                    setEditingExpense(null);
                    setSettlingDebtId(null);
                    setOptimizedPayeeId(null);
                    setAmount("");
                    setNote("");
                    setDescription("");
                    setCategoryId("");
                    setAccount("");
                    setGroupId("");
                    setDate(new Date().toISOString().split("T")[0]);
                    setSplitAmounts({});
                    setCustomSplits({});
                    setSplitMode("equal");
                  } else {
                    confirmDelete();
                  }
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm transition-colors"
              >
                {warning
                  ? editingExpense
                    ? "Update Anyway"
                    : "Add Anyway"
                  : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
