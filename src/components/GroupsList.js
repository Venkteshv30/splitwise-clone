// components/GroupsList.js
import React from "react";
import { Plus, Users, Loader2 } from "lucide-react";
import { useAppContext } from "../contexts/AppContext";
import { useGroups } from "../hooks/useFirestore";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { generateGroupAvatar } from "../utils/groupAvatar";
import { cn } from "../lib/utils";

const GroupsList = () => {
  const { currentUser, setSelectedGroup, setCurrentPage } = useAppContext();
  const { groups, loading } = useGroups(currentUser?.email);

  const handleGroupSelect = (group) => {
    setSelectedGroup(group);
    setCurrentPage("groupDetail");
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-end items-center mb-3 sm:mb-4">
          <Button size="icon" variant="ghost" disabled>
            <Loader2 className="h-4 w-4 animate-spin" />
          </Button>
        </div>
        <div className="min-h-[50vh] flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-end items-center mb-3 sm:mb-4">
        <Button
          size="icon"
          onClick={() => setCurrentPage("createGroup")}
          className="h-9 w-9"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-xs sm:text-sm text-muted-foreground mb-4">
            No groups found. <br />
            Create your first group to start splitting expenses!
          </p>
          <Button size="sm" onClick={() => setCurrentPage("createGroup")}>
            <Plus className="h-4 w-4 mr-2" />
            Create Group
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {groups.map((group) => (
            <Card
              key={group.id}
              className={cn(
                "cursor-pointer transition-all hover:bg-accent/50 border-border"
              )}
              onClick={() => handleGroupSelect(group)}
            >
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center">
                  {/* Group Avatar */}
                  {(() => {
                    const avatarStyle =
                      group.avatarColor && group.avatarPattern
                        ? {
                            backgroundColor: group.avatarColor,
                            patternColor: group.avatarPattern,
                          }
                        : generateGroupAvatar(group.name);
                    return (
                      <div
                        className="h-10 w-10 mr-3 flex-shrink-0 rounded-lg"
                        style={{
                          backgroundColor: `hsl(${avatarStyle.backgroundColor})`,
                          backgroundImage: `
                            linear-gradient(45deg, hsl(${avatarStyle.patternColor}) 25%, transparent 25%),
                            linear-gradient(-45deg, hsl(${avatarStyle.patternColor}) 25%, transparent 25%),
                            linear-gradient(45deg, transparent 75%, hsl(${avatarStyle.patternColor}) 75%),
                            linear-gradient(-45deg, transparent 75%, hsl(${avatarStyle.patternColor}) 75%)
                          `,
                          backgroundSize: "10px 10px",
                          backgroundPosition: "0 0, 0 5px, 5px -5px, -5px 0px",
                        }}
                      />
                    );
                  })()}

                  {/* Group Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base font-semibold mb-0.5 truncate text-foreground">
                      {group.name}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <p className="text-xs sm:text-sm text-muted-foreground flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        {group.members?.length || 0} member
                        {group.members?.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default GroupsList;
