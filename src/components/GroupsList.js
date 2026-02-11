// components/GroupsList.js
import React from "react";
import { Button, Card, Typography, Avatar, Empty, Spin } from "antd";
import { PlusOutlined, TeamOutlined } from "@ant-design/icons";
import { useAppContext } from "../contexts/AppContext";
import { useGroups } from "../hooks/useFirestore";

const { Text } = Typography;

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
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <Text className="text-sm sm:text-base font-semibold">
            Your Groups
          </Text>
          <Button type="primary" icon={<PlusOutlined />} loading size="small" />
        </div>
        <div className="min-h-[50vh] flex items-center justify-center">
          <Spin />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-3 sm:mb-4">
        <Text className="text-sm sm:text-base font-semibold">Your Groups</Text>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCurrentPage("createGroup")}
          size="small"
        />
      </div>

      {groups.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <span className="text-xs sm:text-sm">
              No groups found. <br />
              Create your first group to start splitting expenses!
            </span>
          }
        >
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCurrentPage("createGroup")}
            size="small"
          />
        </Empty>
      ) : (
        <div className="space-y-2">
          {groups.map((group) => (
            <Card
              key={group.id}
              hoverable
              className="cursor-pointer transition-all"
              onClick={() => handleGroupSelect(group)}
              size="small"
              bodyStyle={{ padding: "12px 16px" }}
            >
              <div className="flex items-center">
                {/* Avatar */}
                <Avatar
                  size={40}
                  icon={<TeamOutlined />}
                  className="bg-blue-500 mr-3 flex-shrink-0"
                />

                {/* Group Info */}
                <div className="flex-1 min-w-0">
                  <Text
                    strong
                    className="block text-sm sm:text-base mb-0.5 truncate"
                  >
                    {group.name}
                  </Text>
                  <div className="flex items-center space-x-2">
                    <Text type="secondary" className="text-xs sm:text-sm">
                      <TeamOutlined className="mr-1" />
                      {group.members?.length || 0} member
                      {group.members?.length !== 1 ? "s" : ""}
                    </Text>
                    {/* {group.creator && (
                      <>
                        <span className="text-gray-300">•</span>
                        <Text type="secondary" className="text-xs sm:text-sm">
                          {group.creator === currentUser?.uid ? "You" : "Created by " + (group.creator?.split("@")[0] || group.creator)}
                        </Text>
                      </>
                    )} */}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default GroupsList;
