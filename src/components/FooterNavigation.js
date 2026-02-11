// components/FooterNavigation.js
import React from "react";
import { Users, User } from "lucide-react";
import { useAppContext } from "../contexts/AppContext";
import { cn } from "../lib/utils";

const FooterNavigation = () => {
  const { currentPage, setCurrentPage } = useAppContext();

  const navItems = [
    {
      key: "groups",
      icon: Users,
      label: "Groups",
      page: "groups",
    },
    {
      key: "profile",
      icon: User,
      label: "Profile",
      page: "profile",
    },
  ];

  const isActive = (page) => currentPage === page;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 md:hidden safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              type="button"
              className={cn(
                "flex flex-col items-center justify-center h-full px-6 flex-1 transition-colors",
                isActive(item.page)
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
              onClick={() => setCurrentPage(item.page)}
            >
              <Icon className="h-5 w-5 mb-0.5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default FooterNavigation;
