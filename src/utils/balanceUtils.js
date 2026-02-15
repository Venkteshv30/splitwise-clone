/**
 * Compute group balances from expenses and settlements (settle-up payments).
 * Balance = (paid - owes) from expenses, then adjusted by settlements:
 * - When A pays B: A's balance += amount, B's balance -= amount
 */

export function computeBalances(expenses, settlements, members) {
  const balances = {};
  (members || []).forEach((member) => {
    balances[member.user_id] = {
      paid: 0,
      owes: 0,
      balance: 0,
      name: member?.name,
    };
  });

  // From expenses
  (expenses || []).forEach((expense) => {
    if (!expense.amount || !expense.paidBy || !expense.sharedBy) return;
    const shareAmount = expense.amount / expense.sharedBy.length;
    if (balances[expense.paidBy]) {
      balances[expense.paidBy].paid += expense.amount;
    }
    expense.sharedBy.forEach((sharer) => {
      if (balances[sharer]) {
        balances[sharer].owes += shareAmount;
      }
    });
  });

  // Net from expenses
  Object.keys(balances).forEach((person) => {
    balances[person].balance = balances[person].paid - balances[person].owes;
  });

  // Apply settlements: fromUserId paid toUserId → from balance += amount, to balance -= amount
  (settlements || []).forEach((s) => {
    const amount = Number(s.amount) || 0;
    if (balances[s.fromUserId] != null) {
      balances[s.fromUserId].balance += amount;
    }
    if (balances[s.toUserId] != null) {
      balances[s.toUserId].balance -= amount;
    }
  });

  return balances;
}

/** Get creditors (balance > 0) and debtors (balance < 0) from balances object */
export function getCreditorsAndDebtors(balances) {
  const creditors = Object.entries(balances)
    .filter(([, b]) => b.balance > 0.01)
    .sort(([, a], [, b]) => b.balance - a.balance);
  const debtors = Object.entries(balances)
    .filter(([, b]) => b.balance < -0.01)
    .sort(([, a], [, b]) => a.balance - b.balance);
  const even = Object.entries(balances).filter(
    ([, b]) => Math.abs(b.balance) <= 0.01
  );
  return { creditors, debtors, even };
}
