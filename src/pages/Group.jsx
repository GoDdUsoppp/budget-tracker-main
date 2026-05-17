import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "../utils/currency";

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);

  const [newGroupName, setNewGroupName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  const fetchGroupsAndInvites = useCallback(async () => {
    try {
      const currentUserId = user.id || user._id;
      const [groupRes, inviteRes, expenseRes] = await Promise.all([
        fetch(`http://localhost:3001/api/groups/user/${currentUserId}`),
        fetch(`http://localhost:3001/api/groups/invitations/${user.email}`),
        fetch(`http://localhost:3001/api/expenses?userId=${currentUserId}`),
      ]);
      setGroups(await groupRes.json());
      setInvitations(await inviteRes.json());

      const expData = await expenseRes.json();
      setExpenses(Array.isArray(expData) ? expData : []);
    } catch (err) {
      console.error("Failed to load groups data");
    }
  }, [user.id, user.email, user._id]);

  useEffect(() => {
    fetchGroupsAndInvites();
  }, [fetchGroupsAndInvites]);

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess("");
        setError("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      const currentUserId = user.id || user._id;
      const res = await fetch("http://localhost:3001/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newGroupName, userId: currentUserId }),
      });
      if (!res.ok) throw new Error("Failed to create group");
      setNewGroupName("");
      setSuccess("Group created successfully!");
      fetchGroupsAndInvites();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!activeGroup)
      return alert("Please select a group to invite friends to.");
    try {
      const currentUserId = user.id || user._id;
      const res = await fetch("http://localhost:3001/api/groups/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: activeGroup._id,
          senderId: currentUserId,
          receiverEmail: inviteEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setInviteEmail("");
      setSuccess("Invitation sent!");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAcceptInvite = async (inviteId) => {
    try {
      const currentUserId = user.id || user._id;
      const res = await fetch(
        `http://localhost:3001/api/groups/invitations/${inviteId}/accept`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentUserId }),
        },
      );
      if (!res.ok) throw new Error("Failed to accept");
      setSuccess("You joined the group!");
      fetchGroupsAndInvites();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteGroup = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${activeGroup.name}"? All group history will be lost.`,
      )
    )
      return;
    try {
      const currentUserId = user.id || user._id;
      const res = await fetch(
        `http://localhost:3001/api/groups/${activeGroup._id}?userId=${currentUserId}`,
        { method: "DELETE" },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete group");
      setSuccess("Group deleted successfully!");
      setActiveGroup(null);
      fetchGroupsAndInvites();
    } catch (err) {
      setError(err.message);
    }
  };

  const inputClasses =
    "w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  const currentUserId = user.id || user._id;

  const activeGroupExpenses = expenses.filter((exp) => {
    const expGroupId = exp.groupId?._id || exp.groupId;
    return expGroupId === activeGroup?._id;
  });

  const sortedGroupHistory = [...activeGroupExpenses].sort(
    (a, b) => new Date(b.date) - new Date(a.date),
  );

  const paymentsToClaim = activeGroupExpenses.filter((exp) => {
    const expOwnerId = exp.userId?._id || exp.userId;
    if (expOwnerId !== currentUserId) return false;
    return exp.splitDetails?.some(
      (split) => split.hasPaid && !split.incomeClaimed,
    );
  });

  const getSimplifiedDebts = () => {
    if (!activeGroup) return [];

    const balances = {};
    activeGroup.members.forEach((m) => (balances[m._id] = 0));

    activeGroupExpenses.forEach((exp) => {
      const lenderId = exp.userId?._id || exp.userId;
      exp.splitDetails?.forEach((split) => {
        if (!split.hasPaid) {
          const borrowerId = split.user?._id || split.user;
          balances[borrowerId] -= split.amountOwed;
          balances[lenderId] += split.amountOwed;
        }
      });
    });

    const debtors = [];
    const creditors = [];
    for (const [id, balance] of Object.entries(balances)) {
      if (balance < -0.01) debtors.push({ id, amount: Math.abs(balance) });
      if (balance > 0.01) creditors.push({ id, amount: balance });
    }

    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const simplified = [];
    let i = 0,
      j = 0;
    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const amount = Math.min(debtor.amount, creditor.amount);

      simplified.push({
        fromId: debtor.id,
        from:
          activeGroup.members.find((m) => m._id === debtor.id)?.name ||
          "Unknown",
        toId: creditor.id,
        to:
          activeGroup.members.find((m) => m._id === creditor.id)?.name ||
          "Unknown",
        amount: amount,
      });

      debtor.amount -= amount;
      creditor.amount -= amount;

      if (debtor.amount < 0.01) i++;
      if (creditor.amount < 0.01) j++;
    }
    return simplified;
  };

  const simplifiedDebts = getSimplifiedDebts();

  return (
    <div className="space-y-8 text-gray-900 dark:text-gray-100">
      {success && (
        <div className="bg-green-600 text-white px-5 py-3 rounded-lg shadow-lg">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-600 text-white px-5 py-3 rounded-lg shadow-lg">
          {error}
        </div>
      )}

      {invitations.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-blue-900 dark:text-blue-100">
            Pending Invitations
          </h3>
          <div className="space-y-3">
            {invitations.map((invite) => (
              <div
                key={invite._id}
                className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-blue-100 dark:border-blue-800/50"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Invited to:{" "}
                    <span className="font-bold">{invite.groupId?.name}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    By {invite.senderId?.name}
                  </p>
                </div>
                <button
                  onClick={() => handleAcceptInvite(invite._id)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm transition-colors"
                >
                  Accept
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border border-gray-100 dark:border-slate-700">
          <h2 className="text-xl font-semibold mb-6">Create Group</h2>
          <form onSubmit={handleCreateGroup} className="space-y-4">
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Group Name"
              className={inputClasses}
              required
            />
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 text-sm rounded"
            >
              Create
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border border-gray-100 dark:border-slate-700">
          <h2 className="text-xl font-semibold mb-6">My Groups</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {groups.map((group) => (
              <div
                key={group._id}
                onClick={() => setActiveGroup(group)}
                className={`cursor-pointer border rounded-lg p-4 transition-all ${activeGroup?._id === group._id ? "border-blue-500 bg-blue-50 dark:bg-slate-700/80 shadow-md ring-1 ring-blue-500" : "border-gray-200 dark:border-slate-600 hover:border-blue-300"}`}
              >
                <h3 className="font-bold text-lg">{group.name}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {group.members.length} Members
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {activeGroup && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-600 overflow-hidden mt-8">
          <div className="bg-gray-50 dark:bg-slate-700/50 p-6 border-b border-gray-200 dark:border-slate-600 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {activeGroup.name} Ledger
              </h2>
            </div>
            <div className="flex flex-col items-end gap-3">
              <form onSubmit={handleSendInvite} className="flex gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Invite friend by email..."
                  className={`${inputClasses} w-64`}
                  required
                />
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm rounded"
                >
                  Invite
                </button>
              </form>
              {activeGroup.createdBy === currentUserId && (
                <button
                  onClick={handleDeleteGroup}
                  className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 font-medium transition-colors"
                >
                  Delete Group
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-slate-700">
            <div className="p-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">
                Group Roster
              </h3>
              <ul className="space-y-3 mb-8">
                {activeGroup.members.map((member) => (
                  <li key={member._id} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-slate-600 text-blue-600 dark:text-blue-300 rounded-full flex items-center justify-center font-bold text-sm">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium">
                      {member.name}{" "}
                      {member._id === currentUserId ? "(You)" : ""}
                    </span>
                  </li>
                ))}
              </ul>

              {paymentsToClaim.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-3">
                    Update Income
                  </h3>
                  {paymentsToClaim.map((debt) => (
                    <div
                      key={debt._id + "claim"}
                      className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800"
                    >
                      {debt.splitDetails
                        .filter((s) => s.hasPaid && !s.incomeClaimed)
                        .map((split) => {
                          const memberName =
                            activeGroup.members.find(
                              (m) => m._id === (split.user?._id || split.user),
                            )?.name || "A member";
                          return (
                            <div key={split.user} className="space-y-2">
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  <span className="font-bold">
                                    {memberName}
                                  </span>{" "}
                                  paid you back!
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  For: {debt.note}
                                </p>
                              </div>
                              <div className="flex justify-between items-center pt-2 border-t border-blue-200 dark:border-blue-800/50 mt-2">
                                <p className="font-bold text-blue-600 dark:text-blue-400">
                                  {formatCurrency(split.amountOwed)}
                                </p>
                                <button
                                  onClick={() =>
                                    navigate("/income", {
                                      state: {
                                        claimIncome: {
                                          expenseId: debt._id,
                                          userId: split.user?._id || split.user,
                                          amount: split.amountOwed,
                                          note: `Repayment from ${memberName} for ${debt.note}`,
                                        },
                                      },
                                    })
                                  }
                                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded transition-colors"
                                >
                                  Claim
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 col-span-2">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Reimbursements
              </h3>

              {simplifiedDebts.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-slate-700/30 rounded-lg border border-gray-100 dark:border-slate-700">
                  <p className="text-gray-500 font-medium">
                    All group debts are completely settled.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {simplifiedDebts.map((debt, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center bg-purple-50 dark:bg-purple-900/10 p-5 rounded-lg border border-purple-200 dark:border-purple-800/30 shadow-sm"
                    >
                      <div>
                        <p className="text-base text-gray-700 dark:text-gray-300">
                          <span className="font-bold text-gray-900 dark:text-white">
                            {debt.from}
                          </span>{" "}
                          owes{" "}
                          <span className="font-bold text-gray-900 dark:text-white">
                            {debt.to}
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                          {formatCurrency(debt.amount)}
                        </p>

                        {debt.fromId === currentUserId && (
                          <button
                            onClick={() =>
                              navigate("/expenses", {
                                state: {
                                  settleOptimized: {
                                    amount: debt.amount,
                                    toId: debt.toId,
                                    toName: debt.to,
                                    groupId: activeGroup._id,
                                  },
                                },
                              })
                            }
                            className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition-colors"
                          >
                            Settle Up
                          </button>
                        )}
                        {debt.toId === currentUserId && (
                          <span className="text-xs font-medium text-purple-400 italic">
                            Waiting...
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">
              Group Expense History
            </h3>

            {sortedGroupHistory.length === 0 ? (
              <p className="text-sm text-gray-500 italic">
                No expenses have been added to this group yet.
              </p>
            ) : (
              <div className="space-y-3">
                {sortedGroupHistory.map((exp) => {
                  const creatorName =
                    activeGroup.members.find(
                      (m) => m._id === (exp.userId?._id || exp.userId),
                    )?.name || "Unknown";
                  const isSettlement = exp.settlingDebtId != null;

                  return (
                    <div
                      key={exp._id}
                      className={`flex justify-between items-center p-3 rounded-lg border ${isSettlement ? "bg-gray-100 dark:bg-slate-700 border-gray-200 dark:border-slate-600" : "bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700"} shadow-sm`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-center w-12 text-gray-500 dark:text-gray-400">
                          <p className="text-xs font-bold uppercase">
                            {new Date(exp.date).toLocaleDateString("en-US", {
                              month: "short",
                            })}
                          </p>
                          <p className="text-lg font-semibold">
                            {new Date(exp.date).getDate()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                            {exp.note}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {isSettlement
                              ? "Settlement payment by "
                              : "Paid by "}
                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                              {creatorName}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-bold ${isSettlement ? "text-gray-600 dark:text-gray-300" : "text-gray-900 dark:text-white"}`}
                        >
                          {formatCurrency(exp.amount)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
