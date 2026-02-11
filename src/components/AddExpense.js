// components/AddExpense.js
import React, { useState, useEffect } from "react";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { useAppContext } from "../contexts/AppContext";
import { useExpenses } from "../hooks/useFirestore";
import { Button } from "./ui/button";
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

const AddExpense = () => {
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    paidBy: "",
    sharedBy: [],
  });
  const [loading, setLoading] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const { selectedGroup, currentUser, setCurrentPage } = useAppContext();
  const { addExpense } = useExpenses(selectedGroup?.id);

  // Sync selectAll with sharedBy
  useEffect(() => {
    const allMembers = selectedGroup?.members?.map((m) => m.user_id) || [];
    const allSelected =
      allMembers.length > 0 &&
      allMembers.every((id) => formData.sharedBy.includes(id));
    setSelectAll(allSelected);
  }, [formData.sharedBy, selectedGroup?.members]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (
      !formData.description ||
      !formData.amount ||
      !formData.paidBy ||
      formData.sharedBy.length === 0
    ) {
      return;
    }

    setLoading(true);
    try {
      const expenseData = {
        groupId: selectedGroup.id,
        description: formData.description,
        amount: parseFloat(formData.amount),
        paidBy: formData.paidBy,
        sharedBy: formData.sharedBy,
        createdBy: currentUser.uid,
        date: new Date().toISOString().split("T")[0],
      };

      await addExpense(expenseData);
      setCurrentPage("groupDetail");
    } catch (error) {
      console.error("Error adding expense:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked) => {
    const allMembers = selectedGroup?.members?.map((m) => m.user_id) || [];

    if (checked) {
      setFormData((prev) => ({
        ...prev,
        sharedBy: allMembers,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        sharedBy: [],
      }));
    }
  };

  const handlePaidByChange = (value) => {
    setFormData((prev) => {
      const newData = { ...prev, paidBy: value };
      // Auto-select payer in sharedBy if not already selected
      if (
        value &&
        !prev.sharedBy.includes(value) &&
        prev.sharedBy.length === 0
      ) {
        newData.sharedBy = [value];
      }
      return newData;
    });
  };

  if (!selectedGroup) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          No group selected
        </h3>
        <Button onClick={() => setCurrentPage("groups")}>Go to Groups</Button>
      </div>
    );
  }

  const isFormValid =
    formData.description &&
    formData.amount &&
    formData.paidBy &&
    formData.sharedBy.length > 0;

  return (
    <div className="max-w-2xl mx-auto h-full flex flex-col px-4 sm:px-6">
      {/* Header with Back and Submit (Tick) */}
      <div className="flex items-center justify-between mb-4 sm:mb-6 flex-shrink-0 pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentPage("groupDetail")}
          className="p-0 h-auto"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-lg sm:text-2xl font-semibold text-foreground">
          Add Expense
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSubmit}
          disabled={!isFormValid || loading}
          className="p-0 h-auto disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Check className="h-5 w-5" />
          )}
        </Button>
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto scrollbar-hide">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-xs sm:text-sm">
              Description
            </Label>
            <Input
              id="description"
              placeholder="What was this expense for?"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="text-sm border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-foreground"
              autoComplete="off"
              required
            />
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-xs sm:text-sm">
              Amount
            </Label>
            <div className="relative">
              <span className="absolute left-0 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                ₹
              </span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                className="pl-8 text-sm border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-foreground"
                autoComplete="off"
                required
              />
            </div>
          </div>

          {/* Paid By */}
          <div className="space-y-2">
            <Label htmlFor="paidBy" className="text-xs sm:text-sm">
              Paid By
            </Label>
            <Select value={formData.paidBy} onValueChange={handlePaidByChange}>
              <SelectTrigger id="paidBy" className="text-sm">
                <SelectValue placeholder="Select who paid" />
              </SelectTrigger>
              <SelectContent>
                {selectedGroup.members?.map((member) => (
                  <SelectItem key={member.user_id} value={member.user_id}>
                    {member.name}
                    {member.user_id === currentUser.email && " (You)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Who actually paid for this expense?
            </p>
          </div>

          {/* Shared By */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm">
              Shared By ({formData.sharedBy.length} selected)
            </Label>
            <div className="p-3 bg-muted/30 rounded-lg space-y-2">
              {/* Select All - First item */}
              <div className="flex items-center space-x-2 hover:bg-accent/50 rounded p-1 -m-1 pb-2 border-b border-border mb-2">
                <Checkbox
                  id="selectAll"
                  checked={selectAll}
                  onCheckedChange={handleSelectAll}
                />
                <Label
                  htmlFor="selectAll"
                  className="text-xs sm:text-sm font-medium cursor-pointer flex-1"
                >
                  Select All Members
                </Label>
              </div>
              {selectedGroup.members?.map((member) => {
                const isChecked = formData.sharedBy.includes(member.user_id);
                return (
                  <div
                    key={member.user_id}
                    className="flex items-center space-x-2 hover:bg-accent/50 rounded p-1 -m-1"
                  >
                    <Checkbox
                      id={`shared-${member.user_id}`}
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData((prev) => ({
                            ...prev,
                            sharedBy: [...prev.sharedBy, member.user_id],
                          }));
                        } else {
                          setFormData((prev) => ({
                            ...prev,
                            sharedBy: prev.sharedBy.filter(
                              (id) => id !== member.user_id
                            ),
                          }));
                        }
                      }}
                    />
                    <Label
                      htmlFor={`shared-${member.user_id}`}
                      className="text-xs sm:text-sm font-normal cursor-pointer flex-1"
                    >
                      {member.name}
                      {member.user_id === currentUser.email && " (You)"}
                    </Label>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground pb-8">
              Who should split this expense? (including those who paid)
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExpense;
