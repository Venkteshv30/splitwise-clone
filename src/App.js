import React, { useState } from "react";
import { Menu, LogOut, Users, Loader2 } from "lucide-react";
import { AppProvider, useAppContext } from "./contexts/AppContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { signOut } from "firebase/auth";
import { auth } from "./firebase";
import Auth from "./components/Auth";
import Sidebar from "./components/Sidebar";
import FooterNavigation from "./components/FooterNavigation";
import GroupsList from "./components/GroupsList";
import CreateGroup from "./components/CreateGroup";
import GroupDetail from "./components/GroupDetail";
import AddExpense from "./components/AddExpense";
import Profile from "./components/Profile";
import TotalPage from "./components/TotalPage";
import BalancesPage from "./components/BalancesPage";
import MembersPage from "./components/MembersPage";
import ChartsPage from "./components/ChartsPage";
import ExportPage from "./components/ExportPage";
import TransactionDetailPage from "./components/TransactionDetailPage";
import SettlementDetailPage from "./components/SettlementDetailPage";
import { Button } from "./components/ui/button";

// Main Content Router Component
const MainContent = () => {
  const { currentPage } = useAppContext();

  switch (currentPage) {
    case "groups":
      return <GroupsList />;
    case "groupDetail":
      return <GroupDetail />;
    case "addExpense":
      return <AddExpense />;
    case "createGroup":
      return <CreateGroup />;
    case "profile":
      return <Profile />;
    case "totalPage":
      return <TotalPage />;
    case "balancesPage":
      return <BalancesPage />;
    case "membersPage":
      return <MembersPage />;
    case "chartsPage":
      return <ChartsPage />;
    case "exportPage":
      return <ExportPage />;
    case "transactionDetail":
      return <TransactionDetailPage />;
    case "settlementDetail":
      return <SettlementDetailPage />;
    default:
      return <GroupsList />;
  }
};

// Icon Sidebar Component
const IconSidebar = ({ onExpandClick, onLogout }) => {
  return (
    <div className="fixed left-0 top-0 h-full w-16 bg-card border-r border-border shadow-lg z-50 flex flex-col">
      {/* Logo/Brand */}
      <div className="h-16 flex items-center justify-center border-b border-border">
        <span className="text-foreground text-xl">💰</span>
      </div>

      {/* Menu Items */}
      <div className="flex-1 flex flex-col items-center py-4 space-y-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onExpandClick}
          className="text-foreground hover:bg-accent w-10 h-10"
          title="Open Menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onExpandClick}
          className="text-foreground hover:bg-accent w-10 h-10"
          title="Groups"
        >
          <Users className="h-5 w-5" />
        </Button>
      </div>

      {/* Logout */}
      <div className="p-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onLogout}
          className="text-destructive hover:bg-destructive/10 w-10 h-10"
          title="Logout"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

// App Layout Component
const AppLayout = () => {
  const { currentUser, loading } = useAppContext();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser) {
    return <Auth />;
  }

  const handleExpandSidebar = () => {
    setSidebarExpanded(true);
  };

  const handleCollapseSidebar = () => {
    setSidebarExpanded(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Icon Sidebar - Desktop only */}
      <div className="hidden md:block">
        <IconSidebar
          onExpandClick={handleExpandSidebar}
          onLogout={handleLogout}
        />
      </div>

      {/* Expanded Sidebar - Desktop only */}
      {sidebarExpanded && (
        <div className="hidden md:block">
          <>
            {/* Overlay */}
            <div
              className="fixed inset-0 bg-black/50 z-40"
              onClick={handleCollapseSidebar}
            />

            {/* Full Sidebar */}
            <div className="fixed left-16 top-0 h-full w-64 bg-card border-r border-border shadow-xl z-50">
              <div onClick={handleCollapseSidebar}>
                <Sidebar />
              </div>
            </div>
          </>
        </div>
      )}

      {/* Main Content */}
      <div
        style={{
          marginLeft: 0,
          height: "100vh",
          overflow: "hidden",
        }}
        className="md:ml-16"
      >
        <div className="p-2 md:p-6 h-full overflow-hidden pb-16 md:pb-6 bg-background">
          <MainContent />
        </div>
      </div>

      {/* Footer Navigation - Mobile only */}
      <FooterNavigation />
    </div>
  );
};

// Main App Component
const App = () => {
  return (
    <ThemeProvider>
      <AppProvider>
        <AppLayout />
      </AppProvider>
    </ThemeProvider>
  );
};

export default App;
