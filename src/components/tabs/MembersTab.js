// components/tabs/MembersTab.js
import React from "react";
import { Mail, User } from "lucide-react";
import { useAppContext } from "../../contexts/AppContext";
import { Card, CardContent } from "../ui/card";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";

const MembersTab = () => {
  const { selectedGroup } = useAppContext();

  // Check if email is a Gmail address
  const isGoogleMail = (email) => {
    return email && email.toLowerCase().includes("@gmail.com");
  };

  // Get initials from name or email
  const getInitials = (name, email) => {
    if (name && name.trim()) {
      const nameParts = name.trim().split(" ");
      if (nameParts.length >= 2) {
        return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
      }
      return nameParts[0][0].toUpperCase();
    }

    // Fallback to email
    if (email) {
      return email[0]?.toUpperCase();
    }

    return "U";
  };

  // Get display name
  const getDisplayName = (member) => {
    if (member.name && member.name.trim()) {
      return member.name;
    }
    return member.user_id ? member.user_id.split("@")[0] : "Unknown User";
  };

  if (
    !selectedGroup ||
    !selectedGroup.members ||
    selectedGroup.members.length === 0
  ) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <User className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">No members in this group</p>
      </div>
    );
  }

  // Find the creator
  const creatorId = selectedGroup.createdBy;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="mb-2 sm:mb-3">
        <p className="text-sm sm:text-base font-semibold block mb-1 text-foreground">
          Group Members
        </p>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {selectedGroup.members.length} member
          {selectedGroup.members.length !== 1 ? "s" : ""} in{" "}
          {selectedGroup.name}
        </p>
      </div>

      {/* Members List */}
      <div className="space-y-2">
        {selectedGroup.members.map((member) => (
          <Card
            key={member.id || member.user_id}
            className="hover:bg-accent/50 transition-colors border-border"
          >
            <CardContent className="p-2 sm:p-3">
              <div className="flex items-center justify-between">
                {/* Left side - Avatar and info */}
                <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <Avatar
                      className={cn(
                        "w-8 h-8 sm:w-10 sm:h-10",
                        isGoogleMail(member.user_id) && "bg-muted"
                      )}
                    >
                      <AvatarFallback className="text-xs sm:text-sm">
                        {getInitials(member.name, member.user_id)}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  {/* Member info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-start items-center space-x-1 mb-0.5">
                      <p className="text-xs sm:text-sm font-semibold text-foreground truncate">
                        {getDisplayName(member)}
                      </p>
                      {isGoogleMail(member.user_id) && (
                        <div className="ml-1 flex-shrink-0">
                          <svg
                            className="w-3 h-3 text-muted-foreground"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                          </svg>
                        </div>
                      )}
                      {member.user_id === creatorId && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-1">
                          Creator
                        </Badge>
                      )}
                    </div>

                    {member.user_id && (
                      <div className="flex items-center space-x-1">
                        <Mail className="text-muted-foreground h-3 w-3" />
                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                          {member.user_id}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side - Status/Role */}
                <div className="hidden sm:block text-right flex-shrink-0">
                  <Badge variant="outline" className="mb-0 text-xs border-green-500/30 text-green-400">
                    Member
                  </Badge>
                  {member.id && (
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      ID: {member.id.slice(-6)}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Stats */}
      <Card className="mt-3 sm:mt-4 bg-muted/30 border-border">
        <CardContent className="p-3 sm:p-4">
          <div className="grid grid-cols-2 gap-2 sm:gap-3 text-center">
            <div>
              <p className="text-foreground block text-sm sm:text-base font-semibold">
                {selectedGroup.members.length}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Total Members
              </p>
            </div>
            <div>
              <p className="text-foreground block text-sm sm:text-base font-semibold">
                {
                  selectedGroup.members.filter((m) => isGoogleMail(m.user_id))
                    .length
                }
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Google Accounts
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MembersTab;
