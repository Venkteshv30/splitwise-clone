// components/tabs/TransactionsTab.js
import React, { useState } from "react";
import {
  ArrowLeft,
  Edit,
  Trash2,
  User,
  Loader2,
  Receipt,
  ShoppingCart,
  UtensilsCrossed,
  Car,
  Film,
  Fuel,
  DollarSign,
} from "lucide-react";
import { useAppContext } from "../../contexts/AppContext";
import { useExpenses } from "../../hooks/useFirestore";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Avatar, AvatarFallback } from "../ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { cn } from "../../lib/utils";

const TransactionsTab = () => {
  const { selectedGroup, currentUser } = useAppContext();
  const { expenses, loading, updateExpense, deleteExpense } = useExpenses(
    selectedGroup?.id
  );
  const [editingExpense, setEditingExpense] = useState(null);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteExpenseId, setDeleteExpenseId] = useState(null);
  const [editForm, setEditForm] = useState({
    description: "",
    amount: "",
    paidBy: "",
    sharedBy: [],
  });

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setEditForm({
      description: expense.description,
      amount: expense.amount?.toString(),
      paidBy: expense.paidBy,
      sharedBy: expense.sharedBy || [],
    });
  };

  const handleSaveEdit = async () => {
    try {
      await updateExpense(editingExpense.id, {
        ...editForm,
        amount: parseFloat(editForm.amount),
      });
      setEditingExpense(null);
      setEditForm({ description: "", amount: "", paidBy: "", sharedBy: [] });
    } catch (error) {
      console.error("Error updating expense:", error);
    }
  };

  const handleDelete = (expenseId) => {
    setDeleteExpenseId(expenseId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteExpense(deleteExpenseId);
      setSelectedExpense(null);
      setShowDeleteModal(false);
      setDeleteExpenseId(null);
    } catch (error) {
      console.error("Error deleting expense:", error);
    }
  };

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
    const desc = description.toLowerCase();
    if (
      desc.includes("food") ||
      desc.includes("dinner") ||
      desc.includes("lunch") ||
      desc.includes("restaurant")
    ) {
      return <UtensilsCrossed className="h-4 w-4" />;
    } else if (
      desc.includes("fuel") ||
      desc.includes("gas") ||
      desc.includes("petrol")
    ) {
      return <Fuel className="h-4 w-4" />;
    } else if (
      desc.includes("cab") ||
      desc.includes("uber") ||
      desc.includes("taxi") ||
      desc.includes("transport")
    ) {
      return <Car className="h-4 w-4" />;
    } else if (desc.includes("movie") || desc.includes("entertainment")) {
      return <Film className="h-4 w-4" />;
    } else if (desc.includes("grocery") || desc.includes("shopping")) {
      return <ShoppingCart className="h-4 w-4" />;
    } else {
      return <Receipt className="h-4 w-4" />;
    }
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
        <p className="text-sm text-muted-foreground mb-4">No transactions yet</p>
        <Button onClick={() => {}}>Add your first expense</Button>
      </div>
    );
  }

  // Show expense detail view
  if (selectedExpense) {
    const { youLent, youBorrowed, shareAmount } =
      calculateAmounts(selectedExpense);

    return (
      <>
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center mb-4 py-2 border-b border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedExpense(null)}
              className="mr-2"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <h3 className="text-sm font-semibold text-foreground">
              Transaction Details
            </h3>
          </div>

          {/* Main Details */}
          <div className="py-4">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">
                {getExpenseIcon(selectedExpense.description)}
              </div>
              <h2 className="text-lg font-semibold mb-2 text-foreground">
                {selectedExpense.description}
              </h2>
              <p className="text-xl text-green-400 font-semibold">
                ₹{selectedExpense.amount?.toFixed(2)}
              </p>
            </div>

            {/* Paid By */}
            <Card className="mb-4 border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs sm:text-sm">Paid By</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {getMemberName(selectedExpense.paidBy)[0]}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-sm font-medium text-foreground">
                      {getMemberName(selectedExpense.paidBy)}
                    </p>
                  </div>
                  <p className="text-sm text-foreground">
                    ₹{selectedExpense.amount?.toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Split Details */}
            <Card className="mb-4 border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs sm:text-sm">Split Between</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {selectedExpense.sharedBy?.map((person) => (
                    <div
                      key={person}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {(person === currentUser?.email
                              ? "You"
                              : getMemberName(person))[0]}
                          </AvatarFallback>
                        </Avatar>
                        <p className="text-sm font-medium text-foreground">
                          {person === currentUser?.email
                            ? "You"
                            : getMemberName(person)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-foreground">
                          ₹{shareAmount.toFixed(2)}
                        </p>
                        {person === currentUser?.email && youBorrowed > 0 && (
                          <p className="text-[10px] text-red-400">you borrowed</p>
                        )}
                        {person === currentUser?.email && youLent > 0 && (
                          <p className="text-[10px] text-green-400">you lent</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Your Summary */}
            {(youLent > 0 || youBorrowed > 0) && (
              <Card className="mb-4 bg-primary/10 border-primary/20">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-2">
                      Your Balance
                    </p>
                    <div className="text-lg font-semibold">
                      {youLent > 0 && (
                        <p className="text-green-400">
                          +₹{youLent.toFixed(2)} (you lent)
                        </p>
                      )}
                      {youBorrowed > 0 && (
                        <p className="text-red-400">
                          -₹{youBorrowed.toFixed(2)} (you borrowed)
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex justify-center space-x-3 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(selectedExpense)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(selectedExpense.id)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Edit Expense Dialog */}
        <Dialog open={!!editingExpense} onOpenChange={(open) => !open && setEditingExpense(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Expense</DialogTitle>
              <DialogDescription>
                Update the expense details below.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  placeholder="What was this expense for?"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount</label>
                <Input
                  type="number"
                  value={editForm.amount}
                  onChange={(e) =>
                    setEditForm({ ...editForm, amount: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Paid By</label>
                <Select
                  value={editForm.paidBy}
                  onValueChange={(value) =>
                    setEditForm({ ...editForm, paidBy: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Who paid for this?" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedGroup?.members?.map((member) => (
                      <SelectItem key={member.user_id} value={member.user_id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Shared By</label>
                <Select
                  value={editForm.sharedBy.join(",")}
                  onValueChange={(value) =>
                    setEditForm({
                      ...editForm,
                      sharedBy: value ? value.split(",") : [],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Who should split this?" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedGroup?.members?.map((member) => (
                      <SelectItem
                        key={member.user_id}
                        value={member.user_id}
                      >
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditingExpense(null)}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Expense</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this expense? This action cannot
                be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Show main list view - grouped by month
  const groupedExpenses = groupExpensesByMonth(expenses);
  const sortedMonths = Object.keys(groupedExpenses).sort((a, b) => {
    return new Date(b) - new Date(a);
  });

  return (
    <div className="space-y-6">
      {sortedMonths.map((monthKey) => (
        <div key={monthKey}>
          {/* Month Header */}
          <h3 className="text-sm font-semibold text-foreground mb-3 px-1">
            {monthKey}
          </h3>

          {/* Expenses for this month */}
          <div className="space-y-1">
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
                    className="flex items-center py-3 px-2 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => setSelectedExpense(expense)}
                  >
                    {/* Date Column */}
                    <div className="text-center mr-3 min-w-[40px]">
                      <div className="text-[10px] text-muted-foreground uppercase leading-tight">
                        {month}
                      </div>
                      <div className="text-sm font-semibold leading-tight text-foreground">
                        {day}
                      </div>
                    </div>

                    {/* Icon */}
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-muted-foreground">
                      {getExpenseIcon(expense.description)}
                    </div>

                    {/* Description Column */}
                    <div className="flex-1 min-w-0">
                      <p className="block truncate text-sm font-medium text-foreground">
                        {expense.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isPaidByCurrentUser
                          ? `You paid ₹${expense.amount?.toFixed(2)}`
                          : `${getMemberName(
                              expense.paidBy
                            )} paid ₹${expense.amount?.toFixed(2)}`}
                      </p>
                    </div>

                    {/* Amount Column */}
                    <div className="text-right min-w-[80px] flex-shrink-0">
                      {youLent > 0 && (
                        <>
                          <div className="text-[10px] text-muted-foreground leading-tight">
                            you lent
                          </div>
                          <div className="text-sm font-semibold text-green-400 leading-tight">
                            ₹{youLent.toFixed(2)}
                          </div>
                        </>
                      )}
                      {youBorrowed > 0 && (
                        <>
                          <div className="text-[10px] text-muted-foreground leading-tight">
                            you borrowed
                          </div>
                          <div className="text-sm font-semibold text-orange-400 leading-tight">
                            ₹{youBorrowed.toFixed(2)}
                          </div>
                        </>
                      )}
                      {youLent === 0 && youBorrowed === 0 && (
                        <>
                          <div className="text-[10px] text-muted-foreground leading-tight">
                            not involved
                          </div>
                          <div className="text-sm font-semibold text-muted-foreground leading-tight">
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

      {/* Edit Expense Dialog for main list */}
      <Dialog open={!!editingExpense} onOpenChange={(open) => !open && setEditingExpense(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>
              Update the expense details below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
                placeholder="What was this expense for?"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount</label>
              <Input
                type="number"
                value={editForm.amount}
                onChange={(e) =>
                  setEditForm({ ...editForm, amount: e.target.value })
                }
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Paid By</label>
              <Select
                value={editForm.paidBy}
                onValueChange={(value) =>
                  setEditForm({ ...editForm, paidBy: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Who paid for this?" />
                </SelectTrigger>
                <SelectContent>
                  {selectedGroup?.members?.map((member) => (
                    <SelectItem key={member.user_id} value={member.user_id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Shared By</label>
              <Select
                value={editForm.sharedBy.join(",")}
                onValueChange={(value) =>
                  setEditForm({
                    ...editForm,
                    sharedBy: value ? value.split(",") : [],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Who should split this?" />
                </SelectTrigger>
                <SelectContent>
                  {selectedGroup?.members?.map((member) => (
                    <SelectItem key={member.user_id} value={member.user_id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingExpense(null)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog for main list */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Expense</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this expense? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TransactionsTab;
