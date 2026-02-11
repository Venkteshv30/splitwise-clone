// components/tabs/TotalTab.js
import React from "react";
import { DollarSign, Loader2 } from "lucide-react";
import { useAppContext } from "../../contexts/AppContext";
import { useExpenses } from "../../hooks/useFirestore";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { cn } from "../../lib/utils";

const TotalTab = () => {
  const { selectedGroup } = useAppContext();
  const { expenses, loading } = useExpenses(selectedGroup?.id);

  const memberNameUserIdMapping = {};
  selectedGroup?.members?.forEach(
    (m) => (memberNameUserIdMapping[m?.user_id] = m?.name)
  );
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
        <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">No expenses to calculate totals</p>
      </div>
    );
  }

  // Calculate total amount
  const totalAmount = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

  // Calculate person-wise totals (amount they paid)
  const personTotals = {};
  expenses.forEach((expense) => {
    if (expense.paidBy && expense.amount) {
      // Since paidBy is always one user, not an array
      const person = expense.paidBy;
      personTotals[person] = (personTotals[person] || 0) + expense.amount;
    }
  });

  // Calculate date-wise spending
  const dateWiseSpend = {};
  expenses.forEach((expense) => {
    if (expense.createdAt && expense.amount) {
      const dateObj = expense.createdAt.toDate
        ? expense.createdAt.toDate()
        : new Date(expense.createdAt);
      const dateStr = dateObj.toDateString();
      dateWiseSpend[dateStr] = (dateWiseSpend[dateStr] || 0) + expense.amount;
    }
  });

  // Helper function to display person name (extract name from email if needed)
  const getDisplayName = (person) => {
    // If person is an email, show part before @
    if (person && person.includes("@")) {
      return person.split("@")[0];
    }
    return person || "Unknown";
  };

  return (
    <div className="space-y-4">
      {/* Total Group Spending */}
      <Card className="text-center border-border">
        <CardContent className="pt-6">
          <p className="text-xs sm:text-sm text-muted-foreground mb-2">Total Group Spending</p>
          <div className="text-2xl sm:text-3xl font-bold text-green-500 mb-1">
            ₹{totalAmount.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            across {expenses.length} transaction
            {expenses.length !== 1 ? "s" : ""}
          </p>
        </CardContent>
      </Card>

      {/* Spending by Person */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs sm:text-sm flex items-center">
            <DollarSign className="mr-2 h-4 w-4" />
            Amount Paid by Each Person
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(personTotals).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No payment information available</p>
          ) : (
            <div className="space-y-0">
              {Object.entries(personTotals)
                .sort(([, a], [, b]) => b - a)
                .map(([person, amount], index, array) => (
                  <div key={person}>
                    <div className="flex items-center justify-between py-2 px-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs sm:text-sm font-medium text-foreground">
                          {getDisplayName(memberNameUserIdMapping[person])}
                        </span>
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-green-500">
                        ₹{amount.toFixed(2)}
                      </span>
                    </div>
                    {index < array.length - 1 && (
                      <div className="border-b border-border" />
                    )}
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
      {/* Date-wise Spending */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs sm:text-sm">Date-wise Spending Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(dateWiseSpend).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No date information available</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(dateWiseSpend)
                .sort(([a], [b]) => new Date(b) - new Date(a))
                .map(([date, amount]) => (
                  <div
                    key={date}
                    className="flex justify-between items-center py-1.5 border-b border-border last:border-b-0"
                  >
                    <span className="text-xs sm:text-sm text-foreground">
                      {new Date(date).toLocaleDateString("en-IN", {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-green-500">
                      ₹{amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              <div className="pt-2 border-t border-border mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm font-semibold text-foreground">Total</span>
                  <span className="text-sm sm:text-base font-semibold text-green-500">
                    ₹
                    {Object.values(dateWiseSpend)
                      .reduce((sum, amount) => sum + amount, 0)
                      .toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TotalTab;
