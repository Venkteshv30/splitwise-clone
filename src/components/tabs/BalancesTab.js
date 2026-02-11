// components/tabs/BalancesTab.js
import React from "react";
import { Calculator, ArrowRight, Loader2 } from "lucide-react";
import { useAppContext } from "../../contexts/AppContext";
import { useExpenses } from "../../hooks/useFirestore";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";

const BalancesTab = () => {
  const { selectedGroup } = useAppContext();
  const { expenses, loading } = useExpenses(selectedGroup?.id);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <Calculator className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">No expenses to calculate balances</p>
      </div>
    );
  }

  // Calculate balances
  const balances = {};
  selectedGroup?.members?.forEach((member) => {
    balances[member.user_id] = {
      paid: 0,
      owes: 0,
      balance: 0,
      name: member?.name,
    };
  });

  expenses.forEach((expense) => {
    if (!expense.amount || !expense.paidBy || !expense.sharedBy) return;

    const shareAmount = expense.amount / expense.sharedBy.length;

    // Add to paid amount for the single payer
    if (balances[expense.paidBy]) {
      balances[expense.paidBy].paid += expense.amount;
    }

    // Add to owes amount for sharers
    expense.sharedBy.forEach((sharer) => {
      if (balances[sharer]) {
        balances[sharer].owes += shareAmount;
      }
    });
  });

  // Calculate net balance
  Object.keys(balances).forEach((person) => {
    balances[person].balance = balances[person].paid - balances[person].owes;
  });

  // Separate creditors and debtors
  const creditors = Object.entries(balances)
    .filter(([, balance]) => balance.balance > 0.01)
    .sort(([, a], [, b]) => b.balance - a.balance);

  const debtors = Object.entries(balances)
    .filter(([, balance]) => balance.balance < -0.01)
    .sort(([, a], [, b]) => a.balance - b.balance);

  const evenMembers = Object.entries(balances).filter(
    ([, balance]) => Math.abs(balance.balance) <= 0.01
  );

  // Simple debt simplification
  const simplifyDebts = () => {
    const settlements = [];

    let creditorsData = creditors.map(([id, balance]) => ({
      id,
      name: balance.name,
      amount: balance.balance,
    }));

    let debtorsData = debtors.map(([id, balance]) => ({
      id,
      name: balance.name,
      amount: Math.abs(balance.balance),
    }));

    while (creditorsData.length > 0 && debtorsData.length > 0) {
      const creditor = creditorsData[0];
      const debtor = debtorsData[0];

      const amount = Math.min(creditor.amount, debtor.amount);

      settlements.push({
        from: debtor.id,
        to: creditor.id,
        fromName: debtor.name,
        toName: creditor.name,
        amount: amount,
      });

      creditor.amount -= amount;
      debtor.amount -= amount;

      if (creditor.amount <= 0.01) {
        creditorsData.shift();
      }
      if (debtor.amount <= 0.01) {
        debtorsData.shift();
      }
    }

    return settlements;
  };

  const settlements = simplifyDebts();

  return (
    <div className="space-y-4">
      {/* Individual Balances */}
      <div className="text-center font-semibold text-xs sm:text-sm text-foreground">
        Individual Balances
      </div>
      <div className="space-y-2">
        {Object.entries(balances)
          .sort(([, a], [, b]) => b.balance - a.balance)
          .map(([person, balance]) => (
            <div
              key={person}
              className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-2 px-2 sm:px-3 border border-border rounded-lg bg-card"
            >
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-semibold text-foreground">
                  {balance.name}
                </p>
                <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                  <span>Paid: ₹{balance.paid.toFixed(2)}</span>
                  <span>|</span>
                  <span>Owes: ₹{balance.owes.toFixed(2)}</span>
                </div>
              </div>
              <div className="mt-1 sm:mt-0">
                <Badge
                  variant={
                    balance.balance >= 0.01
                      ? "default"
                      : balance.balance <= -0.01
                      ? "destructive"
                      : "secondary"
                  }
                  className={cn(
                    "text-[10px] sm:text-xs font-medium",
                    balance.balance >= 0.01 && "bg-green-500/20 text-green-400 border-green-500/30",
                    balance.balance <= -0.01 && "bg-red-500/20 text-red-400 border-red-500/30",
                    Math.abs(balance.balance) <= 0.01 && "bg-muted text-muted-foreground"
                  )}
                >
                  {balance.balance >= 0.01
                    ? "Gets back"
                    : balance.balance <= -0.01
                    ? "Owes"
                    : "Settled"}
                  {Math.abs(balance.balance) > 0.01 &&
                    ` ₹${Math.abs(balance.balance).toFixed(2)}`}
                </Badge>
              </div>
            </div>
          ))}
      </div>

      {/* Debt Simplification */}
      <div className="flex items-center justify-center font-semibold text-xs sm:text-sm mt-4 text-foreground">
        <Calculator className="mr-2 h-4 w-4" />
        Simplified Settlements
      </div>
      {settlements.length === 0 ? (
        <div className="text-center py-4 sm:py-6">
          <p className="text-base sm:text-lg text-green-400 block mb-1">
            🎉 All settled up!
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Everyone's expenses are balanced
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {settlements.map((settlement, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2 px-2 sm:px-3 bg-muted/30 rounded-lg border border-border"
            >
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-xs sm:text-sm text-foreground">
                  {settlement.fromName || settlement.from.split("@")[0]}
                </span>
                <ArrowRight className="text-muted-foreground h-3 w-3 sm:h-4 sm:w-4" />
                <span className="font-semibold text-xs sm:text-sm text-foreground">
                  {settlement.toName || settlement.to.split("@")[0]}
                </span>
              </div>
              <Badge variant="outline" className="text-xs sm:text-sm font-medium border-border text-foreground">
                ₹{settlement.amount.toFixed(2)}
              </Badge>
            </div>
          ))}

          <div className="border-t border-border my-2" />

          <div className="text-center">
            <p className="text-xs sm:text-sm text-muted-foreground">
              With these {settlements.length} transaction
              {settlements.length !== 1 ? "s" : ""}, everyone will be settled
              up!
            </p>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs sm:text-sm">Balance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 text-center">
            <div className="p-2 sm:p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <p className="text-green-400 block text-sm sm:text-base font-semibold">
                {creditors.length}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">Getting money back</p>
            </div>
            <div className="p-2 sm:p-3 bg-red-500/10 rounded-lg border border-red-500/20">
              <p className="text-red-400 block text-sm sm:text-base font-semibold">
                {debtors.length}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">Owe money</p>
            </div>
            <div className="p-2 sm:p-3 bg-muted rounded-lg border border-border">
              <p className="text-muted-foreground block text-sm sm:text-base font-semibold">
                {evenMembers.length}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">All settled</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BalancesTab;
