// components/Sidebar.js
import React from "react";
import { Button, Typography } from "antd";
import { PlusOutlined, TeamOutlined } from "@ant-design/icons";
import { useAppContext } from "../contexts/AppContext";

const { Title } = Typography;

const Sidebar = () => {
  const { setCurrentPage } = useAppContext();

  return (
    <div className="h-full flex flex-col p-4">
      {/* Header */}
      <div className="mb-6">
        <Title level={4} className="text-center text-blue-600 mb-6">
          💰 SplitWise
        </Title>
      </div>

      {/* Navigation Tiles */}
      <div className="flex flex-col space-y-3">
        <Button
          type="default"
          icon={<TeamOutlined />}
          className="w-full h-12 text-left"
          onClick={() => setCurrentPage("groups")}
        >
          Groups
        </Button>

        <Button
          type="default"
          icon={<PlusOutlined />}
          className="w-full h-12 text-left"
          onClick={() => setCurrentPage("createGroup")}
        >
          Create Group
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
