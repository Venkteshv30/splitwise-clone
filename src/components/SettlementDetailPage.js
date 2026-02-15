// components/SettlementDetailPage.js
import React, { useState, useEffect } from "react";
import { ArrowLeft, Edit, Trash2, Banknote } from "lucide-react";
import { useAppContext } from "../contexts/AppContext";
import { useSettlements } from "../hooks/useFirestore";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const SettlementDetailPage = () => {
  const {
    selectedGroup,
    setCurrentPage,
    selectedSettlement,
    setSelectedSettlement,
  } = useAppContext();
  const { updateSettlement, deleteSettlement } = useSettlements(selectedGroup?.id);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    fromUserId: "",
    toUserId: "",
    amount: "",
    note: "",
  });

  const getMemberName = (userId) => {
    const m = selectedGroup?.members?.find((x) => x.user_id === userId);
    return m?.name || userId?.split("@")[0] || "Unknown";
  };

  const formatDate = (createdAt) => {
    if (!createdAt) return "";
    const d = createdAt?.toDate ? createdAt.toDate() : new Date(createdAt);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const handleBack = () => {
    setSelectedSettlement(null);
    setCurrentPage("groupDetail");
  };

  const openEdit = () => {
    if (!selectedSettlement) return;
    setEditForm({
      fromUserId: selectedSettlement.fromUserId || "",
      toUserId: selectedSettlement.toUserId || "",
      amount: selectedSettlement.amount?.toString() ?? "",
      note: selectedSettlement.note || "",
    });
    setEditOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e?.preventDefault();
    const from = editForm.fromUserId?.trim();
    const to = editForm.toUserId?.trim();
    const amount = parseFloat(editForm.amount);
    if (!selectedSettlement?.id || !from || !to || !Number.isFinite(amount) || amount <= 0 || from === to) return;
    try {
      await updateSettlement(selectedSettlement.id, {
        fromUserId: from,
        toUserId: to,
        amount,
        note: editForm.note?.trim() || undefined,
      });
      setSelectedSettlement((prev) =>
        prev && prev.id === selectedSettlement.id
          ? { ...prev, fromUserId: from, toUserId: to, amount, note: editForm.note?.trim() }
          : prev
      );
      setEditOpen(false);
    } catch (err) {
      // error shown by hook
    }
  };

  const handleDelete = () => setDeleteOpen(true);

  const confirmDelete = async () => {
    if (!selectedSettlement?.id) return;
    try {
      await deleteSettlement(selectedSettlement.id);
      setDeleteOpen(false);
      handleBack();
    } catch (err) {
      // error shown by hook
    }
  };

  useEffect(() => {
    if (!selectedSettlement) setCurrentPage("groupDetail");
  }, [selectedSettlement, setCurrentPage]);

  if (!selectedSettlement) return null;

  const amount = Number(selectedSettlement.amount) || 0;
  const validEdit =
    editForm.fromUserId &&
    editForm.toUserId &&
    Number.isFinite(parseFloat(editForm.amount)) &&
    parseFloat(editForm.amount) > 0 &&
    editForm.fromUserId !== editForm.toUserId;

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col overflow-hidden px-4 sm:px-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6 flex-shrink-0 pt-2">
        <Button variant="ghost" size="sm" onClick={handleBack} className="p-0 h-auto">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-lg sm:text-2xl font-semibold text-foreground flex-1 text-center">
          Settlement
        </h2>
        <div className="w-5" />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
        <div className="max-w-2xl mx-auto pb-6">
          <div className="text-center mb-6">
            <div className="mb-3 flex justify-center">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                <Banknote className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            <p className="text-lg font-semibold text-foreground">
              {getMemberName(selectedSettlement.fromUserId)} paid {getMemberName(selectedSettlement.toUserId)}
            </p>
            <p className="text-xl text-green-400 font-semibold mt-1">₹{amount.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground mt-2">{formatDate(selectedSettlement.createdAt)}</p>
            {selectedSettlement.note && (
              <p className="text-sm text-muted-foreground mt-1">Note: {selectedSettlement.note}</p>
            )}
          </div>

          <Card className="mb-4 border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs sm:text-sm">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">From</span>
                <span className="font-medium text-foreground">{getMemberName(selectedSettlement.fromUserId)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">To</span>
                <span className="font-medium text-foreground">{getMemberName(selectedSettlement.toUserId)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium text-foreground">₹{amount.toFixed(2)}</span>
              </div>
              {selectedSettlement.note && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Note</span>
                  <span className="font-medium text-foreground">{selectedSettlement.note}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-center gap-3">
            <Button variant="outline" size="sm" onClick={openEdit} className="gap-1">
              <Edit className="h-4 w-4" />
              Edit
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete} className="gap-1">
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Edit modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Edit settlement</DialogTitle>
            <DialogDescription>Update who paid whom and the amount.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Who paid?</Label>
              <Select
                value={editForm.fromUserId}
                onValueChange={(v) => setEditForm((f) => ({ ...f, fromUserId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent>
                  {selectedGroup?.members?.map((m) => (
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
                value={editForm.toUserId}
                onValueChange={(v) => setEditForm((f) => ({ ...f, toUserId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent>
                  {selectedGroup?.members?.map((m) => (
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
                value={editForm.amount}
                onChange={(e) => setEditForm((f) => ({ ...f, amount: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Note (optional)</Label>
              <Input
                placeholder="e.g. Cash, UPI"
                value={editForm.note}
                onChange={(e) => setEditForm((f) => ({ ...f, note: e.target.value }))}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!validEdit}>
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete settlement</DialogTitle>
            <DialogDescription>
              Remove this settlement from history? Balances will be recalculated. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
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

export default SettlementDetailPage;
