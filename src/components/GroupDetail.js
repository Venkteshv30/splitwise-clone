// components/GroupDetail.js
import React, { useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { useAppContext } from "../contexts/AppContext";
import TransactionsTab from "./tabs/TransactionsTab";
import TotalTab from "./tabs/TotalTab";
import BalancesTab from "./tabs/BalancesTab";
import ExportTab from "./tabs/ExportTab";
import MembersTab from "./tabs/MembersTab";
import { Button } from "./ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Card } from "./ui/card";
import { cn } from "../lib/utils";

const GroupDetail = () => {
  const { selectedGroup, setCurrentPage } = useAppContext();
  const [activeTab, setActiveTab] = useState("transactions");

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

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col overflow-hidden">
      {/* Header - Fixed */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 space-y-3 sm:space-y-0 flex-shrink-0">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPage("groups")}
            className="p-0 mb-1 sm:mb-2 text-xs sm:text-sm h-auto"
          >
            <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
            Back to Groups
          </Button>
          <h2 className="mb-1 text-lg sm:text-2xl font-semibold text-foreground">
            {selectedGroup.name}
          </h2>
          <div className="text-muted-foreground text-xs sm:text-sm">
            {selectedGroup.members?.length || 0} members
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => setCurrentPage("addExpense")}
          className="text-xs sm:text-sm h-8 sm:h-auto"
        >
          <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          Add Expense
        </Button>
      </div>

      {/* Tabs - Fixed Header, Scrollable Content */}
      <Card className="flex flex-col flex-1 min-h-0 overflow-hidden border-border">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="group-detail-tabs flex flex-col flex-1 min-h-0">
          <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent p-0 h-auto">
            <TabsTrigger 
              value="transactions" 
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              Transactions
            </TabsTrigger>
            <TabsTrigger 
              value="total"
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              Total
            </TabsTrigger>
            <TabsTrigger 
              value="balances"
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              Balances
            </TabsTrigger>
            <TabsTrigger 
              value="members"
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              Members
            </TabsTrigger>
            <TabsTrigger 
              value="export"
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              Export
            </TabsTrigger>
          </TabsList>
          <div className="flex-1 min-h-0 overflow-hidden">
            <TabsContent value="transactions" className="mt-0 h-full flex flex-col data-[state=active]:flex">
              <div className="tab-content-scrollable">
                <TransactionsTab />
              </div>
            </TabsContent>
            <TabsContent value="total" className="mt-0 h-full flex flex-col data-[state=active]:flex">
              <div className="tab-content-scrollable">
                <TotalTab />
              </div>
            </TabsContent>
            <TabsContent value="balances" className="mt-0 h-full flex flex-col data-[state=active]:flex">
              <div className="tab-content-scrollable">
                <BalancesTab />
              </div>
            </TabsContent>
            <TabsContent value="members" className="mt-0 h-full flex flex-col data-[state=active]:flex">
              <div className="tab-content-scrollable">
                <MembersTab />
              </div>
            </TabsContent>
            <TabsContent value="export" className="mt-0 h-full flex flex-col data-[state=active]:flex">
              <div className="tab-content-scrollable">
                <ExportTab />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  );
};

export default GroupDetail;
