// components/GroupDetail.js
import React, { useState } from "react";
import { ArrowLeft, Settings, Users, Plus, Calculator, DollarSign, User, Download, BarChart3 } from "lucide-react";
import { useAppContext } from "../contexts/AppContext";
import TransactionsTab from "./tabs/TransactionsTab";
import { Button } from "./ui/button";
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
import { generateGroupAvatar } from "../utils/groupAvatar";
import { useGroups } from "../hooks/useFirestore";

const GroupDetail = () => {
  const { selectedGroup, setCurrentPage, currentUser } = useAppContext();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [groupName, setGroupName] = useState("");
  const { updateGroup } = useGroups(currentUser?.email);

  const isCreator = selectedGroup?.createdBy === currentUser?.email || selectedGroup?.creator === currentUser?.email;

  const handleEditGroupName = () => {
    setGroupName(selectedGroup.name);
    setShowEditDialog(true);
  };

  const handleSaveGroupName = async () => {
    try {
      await updateGroup(selectedGroup.id, { name: groupName });
      setShowEditDialog(false);
    } catch (error) {
      console.error("Error updating group name:", error);
    }
  };

  if (!selectedGroup) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-semibold text-foreground mb-4">No group selected</h3>
        <Button onClick={() => setCurrentPage("groups")}>
          Go to Groups
        </Button>
      </div>
    );
  }

  // Use saved avatar colors or generate new ones
  const avatarStyle = selectedGroup.avatarColor && selectedGroup.avatarPattern
    ? {
        backgroundColor: selectedGroup.avatarColor,
        patternColor: selectedGroup.avatarPattern,
      }
    : generateGroupAvatar(selectedGroup.name);

  const navigationButtons = [
    { key: "total", label: "Total", icon: DollarSign, page: "totalPage" },
    { key: "balances", label: "Balances", icon: Calculator, page: "balancesPage" },
    { key: "members", label: "Members", icon: User, page: "membersPage" },
    { key: "charts", label: "Charts", icon: BarChart3, page: "chartsPage" },
    { key: "export", label: "Export", icon: Download, page: "exportPage" },
  ];

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col overflow-hidden px-4 sm:px-6">
      {/* Header - Fixed */}
      <div className="flex items-center justify-between mb-4 sm:mb-6 flex-shrink-0 pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentPage("groups")}
          className="p-0 h-auto"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center space-x-3 flex-1 px-4">
          {/* Group Avatar */}
          <div
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg flex-shrink-0"
            style={{
              backgroundColor: `hsl(${avatarStyle.backgroundColor})`,
              backgroundImage: `
                linear-gradient(45deg, hsl(${avatarStyle.patternColor}) 25%, transparent 25%),
                linear-gradient(-45deg, hsl(${avatarStyle.patternColor}) 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, hsl(${avatarStyle.patternColor}) 75%),
                linear-gradient(-45deg, transparent 75%, hsl(${avatarStyle.patternColor}) 75%)
              `,
              backgroundSize: "12px 12px",
              backgroundPosition: "0 0, 0 6px, 6px -6px, -6px 0px",
            }}
          />
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-2xl font-semibold text-foreground truncate">
              {selectedGroup.name}
            </h2>
            {/* Members Count Pill */}
            <div className="flex items-center space-x-1 mt-1">
              <div className="inline-flex items-center space-x-1 px-2 py-0.5 bg-muted rounded-full">
                <Users className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {selectedGroup.members?.length || 0} {selectedGroup.members?.length === 1 ? "person" : "people"}
                </span>
              </div>
            </div>
          </div>
        </div>
        {isCreator && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEditGroupName}
            className="p-0 h-auto"
          >
            <Settings className="h-5 w-5" />
          </Button>
        )}
        {!isCreator && <div className="w-5" />}
      </div>

      {/* Border Bottom */}
      <div className="border-b border-border mb-3 flex-shrink-0" />

      {/* Navigation Buttons Row */}
      <div className="flex items-center gap-2 mb-2 flex-shrink-0 overflow-x-auto scrollbar-hide -mx-4 px-4">
        {navigationButtons.map((btn) => {
          const Icon = btn.icon;
          return (
            <Button
              key={btn.key}
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(btn.page)}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs sm:text-sm whitespace-nowrap flex-shrink-0"
            >
              <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>{btn.label}</span>
            </Button>
          );
        })}
      </div>

      {/* Transactions Content - Scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide -mx-4 px-2">
        <TransactionsTab />
      </div>

      {/* Floating Add Expense Button */}
      <Button
        onClick={() => setCurrentPage("addExpense")}
        className="fixed bottom-20 right-4 sm:right-6 z-50 h-14 w-14 rounded-full shadow-lg bg-green-500 hover:bg-green-600 text-white"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Edit Group Name Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Group Name</DialogTitle>
            <DialogDescription>
              Update the name of your group.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="groupName">Group Name</Label>
              <Input
                id="groupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name"
                autoComplete="off"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveGroupName}
              disabled={!groupName.trim()}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GroupDetail;
