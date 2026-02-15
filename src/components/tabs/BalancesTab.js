// components/tabs/BalancesTab.js
import React, { useState } from "react";
import { Calculator, ArrowRight, Loader2, Banknote, History } from "lucide-react";
import { useAppContext } from "../../contexts/AppContext";
import { useExpenses, useSettlements } from "../../hooks/useFirestore";
import { computeBalances, getCreditorsAndDebtors } from "../../utils/balanceUtils";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { cn } from "../../lib/utils";

const BalancesTab = () => {
  const { selectedGroup, currentUser, setCurrentPage, setSelectedSettlement } = useAppContext();
  const { expenses, loading: expensesLoading } = useExpenses(selectedGroup?.id);
  const { settlements, loading: settlementsLoading, addSettlement } = useSettlements(selectedGroup?.id);
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [settleForm, setSettleForm] = useState({
    fromUserId: "",
    toUserId: "",
    amount: "",
    note: "",
  });

  const loading = expensesLoading || settlementsLoading;
  const members = selectedGroup?.members || [];

  const balances = computeBalances(expenses, settlements, members);
  const { creditors, debtors, even: evenMembers } = getCreditorsAndDebtors(balances);

  // Suggested settlements (simplified debts) - who should pay whom
  const suggestedSettlements = (() => {
    const list = [];
    let creditorsData = creditors.map(([id, b]) => ({ id, name: b.name, amount: b.balance }));
    let debtorsData = debtors.map(([id, b]) => ({ id, name: b.name, amount: Math.abs(b.balance) }));
    while (creditorsData.length > 0 && debtorsData.length > 0) {
      const creditor = creditorsData[0];
      const debtor = debtorsData[0];
      const amount = Math.min(creditor.amount, debtor.amount);
      list.push({
        from: debtor.id,
        to: creditor.id,
        fromName: debtor.name,
        toName: creditor.name,
        amount,
      });
      creditor.amount -= amount;
      debtor.amount -= amount;
      if (creditor.amount <= 0.01) creditorsData.shift();
      if (debtor.amount <= 0.01) debtorsData.shift();
    }
    return list;
  })();

  const handleSettleSubmit = async (e) => {
    e?.preventDefault();
    const from = settleForm.fromUserId?.trim();
    const to = settleForm.toUserId?.trim();
    const amount = parseFloat(settleForm.amount);
    if (!from || !to || !Number.isFinite(amount) || amount <= 0) return;
    if (from === to) return;
    try {
      await addSettlement({
        fromUserId: from,
        toUserId: to,
        amount,
        note: settleForm.note?.trim() || undefined,
        createdBy: currentUser?.email || currentUser?.uid,
      });
      setSettleModalOpen(false);
      setSettleForm({ fromUserId: "", toUserId: "", amount: "", note: "" });
    } catch (err) {
      // error already shown by hook
    }
  };

  const getMemberName = (userId) => {
    const m = members.find((x) => x.user_id === userId);
    return m?.name || userId?.split("@")[0] || "Unknown";
  };

  const formatSettlementDate = (createdAt) => {
    if (!createdAt) return "";
    const d = createdAt?.toDate ? createdAt.toDate() : new Date(createdAt);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <Calculator className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">No members in this group</p>
      </div>
    );
  }

  const hasAnyActivity = settlements.length > 0 || expenses.length > 0;

  if (!hasAnyActivity) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
          <Calculator className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground mb-4">No expenses or settlements yet</p>
          <Button onClick={() => setSettleModalOpen(true)} className="gap-2">
            <Banknote className="h-4 w-4" />
            Settle up
          </Button>
        </div>
        <SettleUpModal
          open={settleModalOpen}
          onOpenChange={setSettleModalOpen}
          settleForm={settleForm}
          setSettleForm={setSettleForm}
          members={members}
          onSubmit={handleSettleSubmit}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Settle up button */}
      <div className="flex justify-center">
        <Button onClick={() => setSettleModalOpen(true)} variant="outline" size="sm" className="gap-2">
          <Banknote className="h-4 w-4" />
          Settle up
        </Button>
      </div>

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

      {/* Simplified Settlements (suggested) */}
      <div className="flex items-center justify-center font-semibold text-xs sm:text-sm mt-4 text-foreground">
        <Calculator className="mr-2 h-4 w-4" />
        Simplified Settlements
      </div>
      {suggestedSettlements.length === 0 ? (
        <div className="text-center py-4 sm:py-6">
          <p className="text-base sm:text-lg text-green-400 block mb-1">🎉 All settled up!</p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Everyone&apos;s expenses are balanced
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {suggestedSettlements.map((s, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2 px-2 sm:px-3 bg-muted/30 rounded-lg border border-border"
            >
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-xs sm:text-sm text-foreground">
                  {s.fromName || s.from.split("@")[0]}
                </span>
                <ArrowRight className="text-muted-foreground h-3 w-3 sm:h-4 sm:w-4" />
                <span className="font-semibold text-xs sm:text-sm text-foreground">
                  {s.toName || s.to.split("@")[0]}
                </span>
              </div>
              <Badge variant="outline" className="text-xs sm:text-sm font-medium border-border text-foreground">
                ₹{s.amount.toFixed(2)}
              </Badge>
            </div>
          ))}
          <div className="border-t border-border my-2" />
          <p className="text-xs sm:text-sm text-muted-foreground text-center">
            With these {suggestedSettlements.length} transaction
            {suggestedSettlements.length !== 1 ? "s" : ""}, everyone will be settled up!
          </p>
        </div>
      )}

      {/* Activity – recorded settle-ups */}
      {settlements.length > 0 && (
        <>
          <div className="flex items-center justify-center font-semibold text-xs sm:text-sm mt-4 text-foreground">
            <History className="mr-2 h-4 w-4" />
            Activity
          </div>
          <div className="space-y-2">
            {settlements.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between py-2 px-2 sm:px-3 bg-muted/20 rounded-lg border border-border cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => {
                  setSelectedSettlement(s);
                  setCurrentPage("settlementDetail");
                }}
              >
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <span className="font-medium text-xs sm:text-sm text-foreground truncate">
                    {getMemberName(s.fromUserId)} paid {getMemberName(s.toUserId)} ₹{Number(s.amount).toFixed(2)}
                  </span>
                </div>
                <span className="text-[10px] sm:text-xs text-muted-foreground flex-shrink-0 ml-2">
                  {formatSettlementDate(s.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Summary Stats */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs sm:text-sm">Balance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 text-center">
            <div className="p-2 sm:p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <p className="text-green-400 block text-sm sm:text-base font-semibold">{creditors.length}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Getting money back</p>
            </div>
            <div className="p-2 sm:p-3 bg-red-500/10 rounded-lg border border-red-500/20">
              <p className="text-red-400 block text-sm sm:text-base font-semibold">{debtors.length}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Owe money</p>
            </div>
            <div className="p-2 sm:p-3 bg-muted rounded-lg border border-border">
              <p className="text-muted-foreground block text-sm sm:text-base font-semibold">{evenMembers.length}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">All settled</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <SettleUpModal
        open={settleModalOpen}
        onOpenChange={setSettleModalOpen}
        settleForm={settleForm}
        setSettleForm={setSettleForm}
        members={members}
        onSubmit={handleSettleSubmit}
      />
    </div>
  );
};

function SettleUpModal({ open, onOpenChange, settleForm, setSettleForm, members, onSubmit }) {
  const amountNum = parseFloat(settleForm.amount);
  const valid = settleForm.fromUserId && settleForm.toUserId && Number.isFinite(amountNum) && amountNum > 0 && settleForm.fromUserId !== settleForm.toUserId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Settle up</DialogTitle>
          <DialogDescription>
            Record a payment from one member to another. This updates everyone&apos;s balance.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Who paid?</Label>
            <Select
              value={settleForm.fromUserId}
              onValueChange={(v) => setSettleForm((f) => ({ ...f, fromUserId: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select member" />
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.user_id} value={m.user_id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Who received?</Label>
            <Select
              value={settleForm.toUserId}
              onValueChange={(v) => setSettleForm((f) => ({ ...f, toUserId: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select member" />
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.user_id} value={m.user_id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Amount (₹)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={settleForm.amount}
              onChange={(e) => setSettleForm((f) => ({ ...f, amount: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Note (optional)</Label>
            <Input
              placeholder="e.g. Cash, UPI"
              value={settleForm.note}
              onChange={(e) => setSettleForm((f) => ({ ...f, note: e.target.value }))}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!valid}>
              Record settlement
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default BalancesTab;
