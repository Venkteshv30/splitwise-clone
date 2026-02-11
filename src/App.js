import React, { useState } from "react";
import { Layout, Spin, Button } from "antd";
import { MenuOutlined, LogoutOutlined, TeamOutlined } from "@ant-design/icons";
import { AppProvider, useAppContext } from "./contexts/AppContext";
import { signOut } from "firebase/auth";
import { auth } from "./firebase";
import Auth from "./components/Auth";
import Sidebar from "./components/Sidebar";
import GroupsList from "./components/GroupsList";
import CreateGroup from "./components/CreateGroup";
import GroupDetail from "./components/GroupDetail";
import AddExpense from "./components/AddExpense";

const { Sider, Content } = Layout;

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
    default:
      return <GroupsList />;
  }
};

// Icon Sidebar Component
const IconSidebar = ({ onExpandClick, onLogout }) => {
  return (
    <div className="fixed left-0 top-0 h-full w-16 bg-blue-600 shadow-lg z-50 flex flex-col">
      {/* Logo/Brand */}
      <div className="h-16 flex items-center justify-center border-b border-blue-500">
        <span className="text-white text-xl">💰</span>
      </div>

      {/* Menu Items */}
      <div className="flex-1 flex flex-col items-center py-4 space-y-4">
        <Button
          type="text"
          icon={<MenuOutlined />}
          onClick={onExpandClick}
          className="text-white hover:bg-blue-500 w-10 h-10 flex items-center justify-center"
          title="Open Menu"
        />

        <Button
          type="text"
          icon={<TeamOutlined />}
          onClick={onExpandClick}
          className="text-white hover:bg-blue-500 w-10 h-10 flex items-center justify-center"
          title="Groups"
        />
      </div>

      {/* Logout */}
      <div className="p-2">
        <Button
          type="text"
          icon={<LogoutOutlined />}
          onClick={onLogout}
          className="text-white hover:bg-red-500 w-10 h-10 flex items-center justify-center"
          title="Logout"
        />
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
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
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
    <Layout className="min-h-screen bg-gray-50">
      {/* Icon Sidebar - Always visible */}
      <IconSidebar
        onExpandClick={handleExpandSidebar}
        onLogout={handleLogout}
      />

      {/* Expanded Sidebar */}
      {sidebarExpanded && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={handleCollapseSidebar}
          />

          {/* Full Sidebar */}
          <div className="fixed left-16 top-0 h-full w-64 bg-white shadow-xl z-50">
            <div onClick={handleCollapseSidebar}>
              <Sidebar />
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <Layout style={{ marginLeft: 64, height: '100vh', overflow: 'hidden' }}>
        <Content className="p-2 md:p-6 h-full overflow-hidden">
          <MainContent />
        </Content>
      </Layout>
    </Layout>
  );
};

// Main App Component
const App = () => {
  return (
    <AppProvider>
      <AppLayout />
    </AppProvider>
  );
};

export default App;
