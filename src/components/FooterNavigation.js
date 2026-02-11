// components/FooterNavigation.js
import React from "react";
import { TeamOutlined, UserOutlined } from "@ant-design/icons";
import { useAppContext } from "../contexts/AppContext";

const FooterNavigation = () => {
  const { currentPage, setCurrentPage } = useAppContext();

  const navItems = [
    {
      key: "groups",
      icon: <TeamOutlined />,
      label: "Groups",
      page: "groups",
    },
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Profile",
      page: "profile",
    },
  ];

  const isActive = (page) => currentPage === page;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`flex flex-col items-center justify-center h-full px-6 flex-1 transition-colors ${
              isActive(item.page) ? "text-blue-600" : "text-gray-500"
            }`}
            onClick={() => setCurrentPage(item.page)}
          >
            <span className="text-lg mb-0.5">{item.icon}</span>
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default FooterNavigation;
