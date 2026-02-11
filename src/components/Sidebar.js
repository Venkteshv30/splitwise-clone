// components/Sidebar.js
import React from "react";
import { Plus, Users } from "lucide-react";
import { useAppContext } from "../contexts/AppContext";
import { Button } from "./ui/button";

const Sidebar = () => {
  const { setCurrentPage } = useAppContext();

  return (
    <div className="h-full flex flex-col p-4 bg-card">
      {/* Header */}
      <div className="mb-6">
        <h4 className="text-center text-primary text-lg font-semibold mb-6">
          💰 SplitWise
        </h4>
      </div>

      {/* Navigation Tiles */}
      <div className="flex flex-col space-y-3">
        <Button
          variant="outline"
          className="w-full h-12 justify-start"
          onClick={() => setCurrentPage("groups")}
        >
          <Users className="mr-2 h-4 w-4" />
          Groups
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="w-full h-12"
          onClick={() => setCurrentPage("createGroup")}
          title="Create Group"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
