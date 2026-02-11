// components/CreateGroup.js
import React, { useState } from "react";
import {
  ArrowLeft,
  Check,
  Loader2,
  Plus,
  Trash2,
  User,
  Mail,
  Edit2,
} from "lucide-react";
import { useAppContext } from "../contexts/AppContext";
import { useGroups } from "../hooks/useFirestore";
import { generateGroupAvatar } from "../utils/groupAvatar";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarFallback } from "./ui/avatar";

const CreateGroup = () => {
  const [groupName, setGroupName] = useState("");
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [memberForm, setMemberForm] = useState({
    name: "",
    email: "",
    isGoogleAccount: false,
  });

  const { currentUser, setCurrentPage } = useAppContext();
  const { createGroup } = useGroups(currentUser?.email);

  const validateEmail = (email) => {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const generateRandomId = () => {
    return "user_" + Math.random().toString(36).substr(2, 9);
  };

  const handleAddMember = () => {
    if (!memberForm.name.trim()) {
      return;
    }

    // Validate email only if Google Account is checked
    if (
      memberForm.isGoogleAccount &&
      (!memberForm.email || !validateEmail(memberForm.email))
    ) {
      return;
    }

    // If editing, update existing member
    if (editingMemberId) {
      const updatedMembers = members.map((member) => {
        if (member.id === editingMemberId) {
          return {
            ...member,
            name: memberForm.name.trim(),
            email:
              memberForm.isGoogleAccount && memberForm.email
                ? memberForm.email.trim()
                : null,
            user_id:
              memberForm.isGoogleAccount && memberForm.email
                ? memberForm.email.trim()
                : member.user_id,
            is_google_email: memberForm.isGoogleAccount,
          };
        }
        return member;
      });
      setMembers(updatedMembers);
      setEditingMemberId(null);
      setMemberForm({ name: "", email: "", isGoogleAccount: false });
      setIsDialogOpen(false);
      return;
    }

    // Check if user already exists (excluding the one being edited)
    const userExists = members.some(
      (member) =>
        member.id !== editingMemberId &&
        (member.name.toLowerCase() === memberForm.name.toLowerCase() ||
          (memberForm.email &&
            member.email &&
            member.email.toLowerCase() === memberForm.email.toLowerCase()))
    );

    if (userExists) {
      return;
    }

    // Check if conflicting with current user
    if (
      memberForm.email === currentUser?.email ||
      memberForm.name.toLowerCase() === currentUser?.displayName?.toLowerCase()
    ) {
      return;
    }

    const newMember = {
      id: Date.now().toString(),
      user_id:
        memberForm.isGoogleAccount && memberForm.email
          ? memberForm.email.trim()
          : generateRandomId(),
      name: memberForm.name.trim(),
      email:
        memberForm.isGoogleAccount && memberForm.email
          ? memberForm.email.trim()
          : null,
      is_google_email: memberForm.isGoogleAccount,
    };

    setMembers([...members, newMember]);
    setMemberForm({ name: "", email: "", isGoogleAccount: false });
    setIsDialogOpen(false);
  };

  const handleEditMember = (member) => {
    setEditingMemberId(member.id);
    setMemberForm({
      name: member.name || "",
      email: member.email || "",
      isGoogleAccount: member.is_google_email || false,
    });
    setIsDialogOpen(true);
  };

  const handleRemoveMember = (memberId) => {
    setMembers(members.filter((member) => member.id !== memberId));
  };

  const handleSubmit = async () => {
    if (!groupName.trim()) {
      return;
    }

    setLoading(true);
    try {
      // Process members for Firestore
      const processedMembers = members.map((member) => ({
        user_id: member.user_id,
        name: member.name,
        email: member.email,
        is_google_email: member.is_google_email,
      }));

      // Add creator as a member
      processedMembers.unshift({
        user_id: currentUser.email,
        name: currentUser.displayName || currentUser.email,
        email: currentUser.email,
        is_google_email: true,
      });

      // Create memberIds array for efficient querying
      const memberIds = processedMembers.map((member) => member.user_id);

      // Generate group avatar pattern
      const avatarStyle = generateGroupAvatar(groupName);

      const groupData = {
        name: groupName.trim(),
        creator: currentUser.email,
        createdBy: currentUser.email,
        members: processedMembers,
        memberIds: memberIds,
        avatarColor: avatarStyle.backgroundColor,
        avatarPattern: avatarStyle.patternColor,
      };

      await createGroup(groupData);
      setCurrentPage("groups");
    } catch (error) {
      console.error("Error creating group:", error);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = groupName.trim().length >= 2;

  const getInitials = (name) => {
    if (!name) return "U";
    const nameParts = name.trim().split(" ");
    if (nameParts.length >= 2) {
      return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
    }
    return nameParts[0][0].toUpperCase();
  };

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col overflow-hidden px-4 sm:px-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6 flex-shrink-0 pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentPage("groups")}
          className="p-0 h-auto"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-lg sm:text-2xl font-semibold text-foreground flex-1 text-center">
          Create Group
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSubmit}
          disabled={!isFormValid || loading}
          className="p-0 h-auto"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Check className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Form Content - Scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
        <div className="space-y-6 pb-4">
          {/* Group Name */}
          <div className="space-y-2">
            <Label htmlFor="groupName" className="text-sm font-medium">
              Group Name
            </Label>
            <Input
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name (e.g., Trip to Goa, Apartment Expenses)"
              autoComplete="off"
              className="border-0 border-b rounded-none px-0"
            />
          </div>

          {/* <div className="border-b border-border" /> */}

          {/* Members Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Group Members</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDialogOpen(true)}
                className="h-8"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add Member
              </Button>
            </div>

            {members.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No members added yet</p>
                <p className="text-xs mt-1">
                  Click "Add Member" to get started
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {members.map((member) => (
                  <Card key={member.id} className="border-border">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-muted text-foreground">
                              {getInitials(member.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {member.name}
                            </p>
                            {member.email && (
                              <div className="flex items-center space-x-1 mt-0.5">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                <p className="text-xs text-muted-foreground truncate">
                                  {member.email}
                                </p>
                                {member.is_google_email && (
                                  <span className="text-[10px] text-green-400 ml-1">
                                    • Gmail
                                  </span>
                                )}
                              </div>
                            )}
                            {!member.email && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                No email provided
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditMember(member)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMember(member.id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Member Dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsDialogOpen(false);
            setEditingMemberId(null);
            setMemberForm({ name: "", email: "", isGoogleAccount: false });
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingMemberId ? "Edit Member" : "Add Member"}
            </DialogTitle>
            <DialogDescription>
              {editingMemberId
                ? "Update member details. Name is required for all members."
                : "Add a new member to your group. Name is required for all members."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="memberName">Name *</Label>
              <Input
                id="memberName"
                value={memberForm.name}
                onChange={(e) =>
                  setMemberForm({ ...memberForm, name: e.target.value })
                }
                placeholder="Enter member's name"
                autoComplete="off"
                className="border-0 border-b rounded-none px-0"
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isGoogleAccount"
                  checked={memberForm.isGoogleAccount}
                  onCheckedChange={(checked) => {
                    setMemberForm({
                      ...memberForm,
                      isGoogleAccount: checked,
                      email: checked ? memberForm.email : "",
                    });
                  }}
                />
                <Label
                  htmlFor="isGoogleAccount"
                  className="text-sm font-normal cursor-pointer"
                >
                  Google Account
                </Label>
              </div>
              {memberForm.isGoogleAccount && (
                <div className="space-y-2">
                  <Label htmlFor="memberEmail">Email *</Label>
                  <Input
                    id="memberEmail"
                    type="email"
                    value={memberForm.email}
                    onChange={(e) =>
                      setMemberForm({ ...memberForm, email: e.target.value })
                    }
                    placeholder="Enter email address"
                    autoComplete="off"
                    className="border-0 border-b rounded-none px-0"
                  />
                  {memberForm.email && !validateEmail(memberForm.email) && (
                    <p className="text-xs text-destructive">
                      Please enter a valid email address
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setEditingMemberId(null);
                setMemberForm({ name: "", email: "", isGoogleAccount: false });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddMember}
              disabled={
                !memberForm.name.trim() ||
                (memberForm.isGoogleAccount &&
                  (!memberForm.email || !validateEmail(memberForm.email)))
              }
            >
              {editingMemberId ? "Save Changes" : "Add Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateGroup;
