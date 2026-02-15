// components/tabs/TransactionsTab.js
import React from "react";
import {
  Loader2,
  Receipt,
  UtensilsCrossed,
  Car,
  Film,
  ShoppingCart,
  Building,
  Banknote,
} from "lucide-react";
import { useAppContext } from "../../contexts/AppContext";
import { useExpenses, useSettlements } from "../../hooks/useFirestore";
import { getCategoryFromDescription } from "../../constants/expenseCategories";
import { Button } from "../ui/button";

const CATEGORY_ICONS = {
  UtensilsCrossed,
  Car,
  Film,
  ShoppingCart,
  Building,
  Receipt,
};

const TransactionsTab = () => {
  const { selectedGroup, currentUser, setCurrentPage, setSelectedExpense, setSelectedSettlement } =
    useAppContext();
  const { expenses, loading: expensesLoading } = useExpenses(selectedGroup?.id);
  const { settlements, loading: settlementsLoading } = useSettlements(selectedGroup?.id);
  const loading = expensesLoading || settlementsLoading;

  // Merge expenses and settlements into one list, normalized for sorting/grouping
  const allTransactions = React.useMemo(() => {
    const list = [];
    (expenses || []).forEach((exp) => {
      list.push({
        type: "expense",
        id: exp.id,
        createdAt: exp.createdAt?.toDate ? exp.createdAt.toDate() : new Date(exp.createdAt),
        raw: exp,
      });
    });
    (settlements || []).forEach((s) => {
      list.push({
        type: "settlement",
        id: s.id,
        createdAt: s.createdAt?.toDate ? s.createdAt.toDate() : new Date(s.createdAt),
        raw: s,
      });
    });
    list.sort((a, b) => b.createdAt - a.createdAt);
    return list;
  }, [expenses, settlements]);

  // Group by month (using createdAt)
  const groupByMonth = React.useMemo(() => {
    const grouped = {};
    allTransactions.forEach((t) => {
      const monthKey = t.createdAt.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
      if (!grouped[monthKey]) grouped[monthKey] = [];
      grouped[monthKey].push(t);
    });
    return grouped;
  }, [allTransactions]);

  const sortedMonths = Object.keys(groupByMonth).sort(
    (a, b) => new Date(b) - new Date(a)
  );

  // Get expense category icon
  const getExpenseIcon = (description) => {
    const { icon } = getCategoryFromDescription(description);
    const IconComponent = CATEGORY_ICONS[icon] || Receipt;
    return <IconComponent className="h-4 w-4" />;
  };

  // Get member name from email
  const getMemberName = (email) => {
    const member = selectedGroup?.members?.find((m) => m.user_id === email);
    return member?.name || email.split("@")[0];
  };

  // Get date parts from a Date or Firestore timestamp
  const getDateParts = (createdAt) => {
    const date = createdAt instanceof Date ? createdAt : (createdAt?.toDate ? createdAt.toDate() : new Date(createdAt));
    const month = date.toLocaleDateString("en-US", { month: "short" });
    const day = date.getDate().toString().padStart(2, "0");
    return { month, day };
  };

  // Calculate individual amounts
  const calculateAmounts = (expense) => {
    const shareAmount = expense.amount / expense.sharedBy?.length || 1;
    const isCurrentUserPayer = expense.paidBy === currentUser?.email;
    const isCurrentUserInvolved = expense.sharedBy?.includes(
      currentUser?.email,
    );

    let youLent = 0;
    let youBorrowed = 0;

    if (isCurrentUserPayer && isCurrentUserInvolved) {
      youLent = expense.amount - shareAmount;
    } else if (isCurrentUserPayer && !isCurrentUserInvolved) {
      youLent = expense.amount;
    } else if (!isCurrentUserPayer && isCurrentUserInvolved) {
      youBorrowed = shareAmount;
    }

    return { youLent, youBorrowed, shareAmount };
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (allTransactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground mb-4">
          No transactions yet
        </p>
        <Button
          onClick={() => setCurrentPage("addExpense")}
          className="bg-green-500 hover:bg-green-600 text-white"
        >
          Add your first expense
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 py-1">
      {sortedMonths.map((monthKey) => (
        <div key={monthKey}>
          <h3 className="text-xs font-semibold text-foreground mb-1.5 px-2">
            {monthKey}
          </h3>
          <div className="space-y-0">
            {groupByMonth[monthKey].map((t) => {
              const { month, day } = getDateParts(t.createdAt);
              if (t.type === "settlement") {
                const s = t.raw;
                const fromName = getMemberName(s.fromUserId);
                const toName = getMemberName(s.toUserId);
                const amount = Number(s.amount) || 0;
                const isYouPaid = s.fromUserId === currentUser?.email;
                const isYouReceived = s.toUserId === currentUser?.email;
                return (
                  <div
                    key={`s-${t.id}`}
                    className="flex items-center py-1.5 px-2 rounded-lg bg-muted/30 border border-border/50 cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => {
                      setSelectedSettlement(t.raw);
                      setCurrentPage("settlementDetail");
                    }}
                  >
                    <div className="text-center mr-2 min-w-[35px]">
                      <div className="text-[9px] text-muted-foreground uppercase leading-tight">{month}</div>
                      <div className="text-xs font-semibold leading-tight text-foreground">{day}</div>
                    </div>
                    <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center mr-2 flex-shrink-0 text-muted-foreground">
                      <Banknote className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="block truncate text-xs font-medium text-foreground">
                        {fromName} paid {toName}
                      </p>
                      <p className="text-[10px] text-muted-foreground leading-tight">
                        {isYouPaid ? "You sent" : isYouReceived ? "You received" : "Settlement"}
                      </p>
                    </div>
                    <div className="text-right min-w-[70px] flex-shrink-0">
                      <div className="text-[9px] text-muted-foreground leading-tight">settled</div>
                      <div className="text-xs font-semibold text-foreground leading-tight">
                        ₹{amount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                );
              }
              const expense = t.raw;
              const { youLent, youBorrowed } = calculateAmounts(expense);
              const isPaidByCurrentUser = expense.paidBy === currentUser?.email;
              const isCurrentUserInExpense =
                isPaidByCurrentUser || expense.sharedBy?.includes(currentUser?.email);

              return (
                <div
                  key={expense.id}
                  className="flex items-center py-1.5 px-2 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => {
                    setSelectedExpense(expense);
                    setCurrentPage("transactionDetail");
                  }}
                >
                  <div className="text-center mr-2 min-w-[35px]">
                    <div className="text-[9px] text-muted-foreground uppercase leading-tight">{month}</div>
                    <div className="text-xs font-semibold leading-tight text-foreground">{day}</div>
                  </div>
                  <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center mr-2 flex-shrink-0 text-muted-foreground">
                    <div className="scale-75">{getExpenseIcon(expense.description)}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="block truncate text-xs font-medium text-foreground">
                      {expense.description}
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-tight">
                      {isPaidByCurrentUser
                        ? `You paid ₹${expense.amount?.toFixed(2)}`
                        : `${getMemberName(expense.paidBy)} paid ₹${expense.amount?.toFixed(2)}`}
                    </p>
                  </div>
                  <div className="text-right min-w-[70px] flex-shrink-0">
                    {youLent > 0 && (
                      <>
                        <div className="text-[9px] text-muted-foreground leading-tight">you lent</div>
                        <div className="text-xs font-semibold text-green-400 leading-tight">₹{youLent.toFixed(2)}</div>
                      </>
                    )}
                    {youBorrowed > 0 && (
                      <>
                        <div className="text-[9px] text-muted-foreground leading-tight">you borrowed</div>
                        <div className="text-xs font-semibold text-orange-400 leading-tight">₹{youBorrowed.toFixed(2)}</div>
                      </>
                    )}
                    {youLent === 0 && youBorrowed === 0 && (
                      <>
                        <div className="text-[9px] text-muted-foreground leading-tight">
                          {isCurrentUserInExpense ? "paid to self" : "not involved"}
                        </div>
                        <div className="text-xs font-semibold text-muted-foreground leading-tight">
                          ₹{isCurrentUserInExpense ? expense.amount?.toFixed(2) : "0.00"}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TransactionsTab;
