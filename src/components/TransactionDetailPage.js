// components/TransactionDetailPage.js
import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Edit,
  Trash2,
  UtensilsCrossed,
  Car,
  Film,
  ShoppingCart,
  Building,
  Receipt,
} from "lucide-react";
import { useAppContext } from "../contexts/AppContext";
import { useExpenses } from "../hooks/useFirestore";
import { getCategoryFromDescription } from "../constants/expenseCategories";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";

const CATEGORY_ICONS = {
  UtensilsCrossed,
  Car,
  Film,
  ShoppingCart,
  Building,
  Receipt,
};

const TransactionDetailPage = () => {
  const {
    selectedGroup,
    currentUser,
    setCurrentPage,
    selectedExpense,
    setSelectedExpense,
  } = useAppContext();
  const { updateExpense, deleteExpense } = useExpenses(selectedGroup?.id);
  const [editingExpense, setEditingExpense] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editForm, setEditForm] = useState({
    description: "",
    amount: "",
    paidBy: "",
    sharedBy: [],
  });

  const getExpenseIcon = (description, large = false) => {
    const { icon } = getCategoryFromDescription(description);
    const IconComponent = CATEGORY_ICONS[icon] || Receipt;
    return (
      <IconComponent
        className={large ? "h-10 w-10" : "h-5 w-5"}
        strokeWidth={2.5}
        aria-hidden
      />
    );
  };

  const getMemberName = (email) => {
    const member = selectedGroup?.members?.find((m) => m.user_id === email);
    return member?.name || email?.split("@")[0] || "Unknown";
  };

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

  const handleBack = () => {
    setSelectedExpense(null);
    setCurrentPage("groupDetail");
  };

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
    if (!editingExpense) return;
    try {
      await updateExpense(editingExpense.id, {
        ...editForm,
        amount: parseFloat(editForm.amount),
      });
      setSelectedExpense((prev) =>
        prev && prev.id === editingExpense.id
          ? { ...prev, ...editForm, amount: parseFloat(editForm.amount) }
          : prev,
      );
      setEditingExpense(null);
      setEditForm({ description: "", amount: "", paidBy: "", sharedBy: [] });
    } catch (error) {
      console.error("Error updating expense:", error);
    }
  };

  const handleDelete = () => setShowDeleteModal(true);

  const confirmDelete = async () => {
    if (!selectedExpense?.id) return;
    try {
      await deleteExpense(selectedExpense.id);
      setShowDeleteModal(false);
      handleBack();
    } catch (error) {
      console.error("Error deleting expense:", error);
    }
  };

  useEffect(() => {
    if (!selectedExpense) {
      setCurrentPage("groupDetail");
    }
  }, [selectedExpense, setCurrentPage]);

  if (!selectedExpense) {
    return null;
  }

  const { youLent, youBorrowed, shareAmount } =
    calculateAmounts(selectedExpense);
  const isCurrentUserInExpense =
    selectedExpense.paidBy === currentUser?.email ||
    selectedExpense.sharedBy?.includes(currentUser?.email);

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col overflow-hidden px-4 sm:px-6">
      {/* Header - single back button, matches ChartsPage / other pages */}
      <div className="flex items-center justify-between mb-4 sm:mb-6 flex-shrink-0 pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="p-0 h-auto"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-lg sm:text-2xl font-semibold text-foreground flex-1 text-center">
          Transaction Details
        </h2>
        <div className="w-5" />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
        <div className="max-w-2xl mx-auto pb-6">
          {/* Main Details */}
          <div className="py-4">
            <div className="text-center mb-6">
              <div className="mb-3 flex justify-center">
                {getExpenseIcon(selectedExpense.description, true)}
              </div>
              <h2 className="text-lg font-semibold mb-2 text-foreground">
                {selectedExpense.description}
              </h2>
              <p className="text-xl text-green-400 font-semibold">
                ₹{selectedExpense.amount?.toFixed(2)}
              </p>
            </div>

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

            <Card className="mb-4 border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs sm:text-sm">
                  Split Between
                </CardTitle>
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
                            {
                              (person === currentUser?.email
                                ? "You"
                                : getMemberName(person))[0]
                            }
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
                          <p className="text-[10px] text-red-400">
                            you borrowed
                          </p>
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

            {(youLent > 0 || youBorrowed > 0 || isCurrentUserInExpense) && (
              <Card className="mb-4 bg-muted/30 border-border">
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
                      {youLent === 0 && youBorrowed === 0 && isCurrentUserInExpense && (
                        <p className="text-muted-foreground">
                          ₹{selectedExpense.amount?.toFixed(2)} (paid to self)
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-center space-x-3 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(selectedExpense)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Expense Dialog */}
      <Dialog
        open={!!editingExpense}
        onOpenChange={(open) => !open && setEditingExpense(null)}
      >
        <DialogContent className="flex flex-col left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-[calc(100%-2rem)] sm:w-full sm:max-w-[600px] max-h-[90dvh] sm:max-h-[85vh] p-4 sm:p-6 overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>
              Update the expense details below.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide space-y-4 py-4 -mx-1 px-1">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Description</Label>
              <Input
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
                placeholder="What was this expense for?"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Amount</Label>
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
              <Label className="text-sm font-medium">Paid By</Label>
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
              <Label className="text-sm font-medium">
                Shared By ({editForm.sharedBy.length} selected)
              </Label>
              <div className="p-3 bg-muted/30 rounded-lg space-y-2 max-h-[200px] overflow-y-auto scrollbar-hide">
                <div className="flex items-center space-x-2 hover:bg-accent/50 rounded p-1 -m-1 pb-2 border-b border-border mb-2">
                  <Checkbox
                    id="detail-edit-selectAll"
                    checked={
                      (selectedGroup?.members?.length ?? 0) > 0 &&
                      selectedGroup?.members?.every((m) =>
                        editForm.sharedBy.includes(m.user_id),
                      )
                    }
                    onCheckedChange={(checked) => {
                      const allIds =
                        selectedGroup?.members?.map((m) => m.user_id) || [];
                      setEditForm((prev) => ({
                        ...prev,
                        sharedBy: checked ? allIds : [],
                      }));
                    }}
                  />
                  <Label
                    htmlFor="detail-edit-selectAll"
                    className="text-sm font-medium cursor-pointer flex-1"
                  >
                    Select All Members
                  </Label>
                </div>
                {selectedGroup?.members?.map((member) => {
                  const isChecked = editForm.sharedBy.includes(member.user_id);
                  return (
                    <div
                      key={member.user_id}
                      className="flex items-center space-x-2 hover:bg-accent/50 rounded p-1 -m-1"
                    >
                      <Checkbox
                        id={`detail-edit-shared-${member.user_id}`}
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setEditForm((prev) => ({
                              ...prev,
                              sharedBy: [...prev.sharedBy, member.user_id],
                            }));
                          } else {
                            setEditForm((prev) => ({
                              ...prev,
                              sharedBy: prev.sharedBy.filter(
                                (id) => id !== member.user_id,
                              ),
                            }));
                          }
                        }}
                      />
                      <Label
                        htmlFor={`detail-edit-shared-${member.user_id}`}
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        {member.name}
                        {member.user_id === currentUser?.email && " (You)"}
                      </Label>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Who should split this expense? (including those who paid)
              </p>
            </div>
          </div>
          <DialogFooter className="flex-shrink-0 pt-2 border-t border-border">
            <Button variant="outline" onClick={() => setEditingExpense(null)}>
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
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
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

export default TransactionDetailPage;
