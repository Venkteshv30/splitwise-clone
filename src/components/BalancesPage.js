// components/BalancesPage.js
import React from "react";
import { ArrowLeft } from "lucide-react";
import { useAppContext } from "../contexts/AppContext";
import { Button } from "./ui/button";
import BalancesTab from "./tabs/BalancesTab";

const BalancesPage = () => {
  const { setCurrentPage } = useAppContext();

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col overflow-hidden px-4 sm:px-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6 flex-shrink-0 pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentPage("groupDetail")}
          className="p-0 h-auto"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-lg sm:text-2xl font-semibold text-foreground flex-1 text-center">
          Balances
        </h2>
        <div className="w-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
        <BalancesTab />
      </div>
    </div>
  );
};

export default BalancesPage;

