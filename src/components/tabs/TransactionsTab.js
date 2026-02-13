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
} from "lucide-react";
import { useAppContext } from "../../contexts/AppContext";
import { useExpenses } from "../../hooks/useFirestore";
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
  const { selectedGroup, currentUser, setCurrentPage, setSelectedExpense } =
    useAppContext();
  const { expenses, loading } = useExpenses(selectedGroup?.id);

  // Group expenses by month
  const groupExpensesByMonth = (expenses) => {
    const grouped = {};
    expenses.forEach((expense) => {
      const date = expense.createdAt?.toDate
        ? expense.createdAt.toDate()
        : new Date(expense.createdAt);
      const monthKey = date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(expense);
    });
    return grouped;
  };

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

  // Get date parts
  const getDateParts = (expense) => {
    const date = expense.createdAt?.toDate
      ? expense.createdAt.toDate()
      : new Date(expense.createdAt);
    const month = date.toLocaleDateString("en-US", { month: "short" });
    const day = date.getDate().toString().padStart(2, "0");
    return { month, day };
  };

  // Calculate individual amounts
  const calculateAmounts = (expense) => {
    const shareAmount = expense.amount / expense.sharedBy?.length || 1;
    const isCurrentUserPayer = expense.paidBy === currentUser?.email;
    const isCurrentUserInvolved = expense.sharedBy?.includes(
      currentUser?.email
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

  if (expenses.length === 0) {
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

  // List view - grouped by month; click goes to TransactionDetailPage
  const groupedExpenses = groupExpensesByMonth(expenses);
  const sortedMonths = Object.keys(groupedExpenses).sort((a, b) => {
    return new Date(b) - new Date(a);
  });

  return (
    <div className="space-y-3 py-1">
      {sortedMonths.map((monthKey) => (
        <div key={monthKey}>
          {/* Month Header */}
          <h3 className="text-xs font-semibold text-foreground mb-1.5 px-2">
            {monthKey}
          </h3>

          {/* Expenses for this month */}
          <div className="space-y-0">
            {groupedExpenses[monthKey]
              .sort((a, b) => {
                const dateA = a.createdAt?.toDate
                  ? a.createdAt.toDate()
                  : new Date(a.createdAt);
                const dateB = b.createdAt?.toDate
                  ? b.createdAt.toDate()
                  : new Date(b.createdAt);
                return dateB - dateA;
              })
              .map((expense) => {
                const { month, day } = getDateParts(expense);
                const { youLent, youBorrowed } = calculateAmounts(expense);
                const isPaidByCurrentUser =
                  expense.paidBy === currentUser?.email;

                return (
                  <div
                    key={expense.id}
                    className="flex items-center py-1.5 px-2 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => {
                      setSelectedExpense(expense);
                      setCurrentPage("transactionDetail");
                    }}
                  >
                    {/* Date Column */}
                    <div className="text-center mr-2 min-w-[35px]">
                      <div className="text-[9px] text-muted-foreground uppercase leading-tight">
                        {month}
                      </div>
                      <div className="text-xs font-semibold leading-tight text-foreground">
                        {day}
                      </div>
                    </div>

                    {/* Icon */}
                    <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center mr-2 flex-shrink-0 text-muted-foreground">
                      <div className="scale-75">
                        {getExpenseIcon(expense.description)}
                      </div>
                    </div>

                    {/* Description Column */}
                    <div className="flex-1 min-w-0">
                      <p className="block truncate text-xs font-medium text-foreground">
                        {expense.description}
                      </p>
                      <p className="text-[10px] text-muted-foreground leading-tight">
                        {isPaidByCurrentUser
                          ? `You paid ₹${expense.amount?.toFixed(2)}`
                          : `${getMemberName(
                              expense.paidBy
                            )} paid ₹${expense.amount?.toFixed(2)}`}
                      </p>
                    </div>

                    {/* Amount Column */}
                    <div className="text-right min-w-[70px] flex-shrink-0">
                      {youLent > 0 && (
                        <>
                          <div className="text-[9px] text-muted-foreground leading-tight">
                            you lent
                          </div>
                          <div className="text-xs font-semibold text-green-400 leading-tight">
                            ₹{youLent.toFixed(2)}
                          </div>
                        </>
                      )}
                      {youBorrowed > 0 && (
                        <>
                          <div className="text-[9px] text-muted-foreground leading-tight">
                            you borrowed
                          </div>
                          <div className="text-xs font-semibold text-orange-400 leading-tight">
                            ₹{youBorrowed.toFixed(2)}
                          </div>
                        </>
                      )}
                      {youLent === 0 && youBorrowed === 0 && (
                        <>
                          <div className="text-[9px] text-muted-foreground leading-tight">
                            not involved
                          </div>
                          <div className="text-xs font-semibold text-muted-foreground leading-tight">
                            ₹0.00
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
