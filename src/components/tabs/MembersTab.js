// components/tabs/MembersTab.js
import React from "react";
import { Card, Avatar, Typography, Tag, Empty } from "antd";
import { GoogleOutlined, MailOutlined } from "@ant-design/icons";
import { useAppContext } from "../../contexts/AppContext";

const { Text, Title } = Typography;

const MembersTab = () => {
  const { selectedGroup } = useAppContext();

  // Check if email is a Gmail address
  const isGoogleMail = (email) => {
    return email && email.toLowerCase().includes("@gmail.com");
  };

  // Get initials from name or email
  const getInitials = (name, email) => {
    if (name && name.trim()) {
      const nameParts = name.trim().split(" ");
      if (nameParts.length >= 2) {
        return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
      }
      return nameParts[0][0].toUpperCase();
    }

    // Fallback to email
    if (email) {
      return email[0]?.toUpperCase();
    }

    return "U";
  };

  // Get display name
  const getDisplayName = (member) => {
    if (member.name && member.name.trim()) {
      return member.name;
    }
    return member.user_id ? member.user_id.split("@")[0] : "Unknown User";
  };

  if (
    !selectedGroup ||
    !selectedGroup.members ||
    selectedGroup.members.length === 0
  ) {
    return (
      <Empty
        description="No members in this group"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="mb-2 sm:mb-3">
        <Text className="text-sm sm:text-base font-semibold block mb-1">
          Group Members
        </Text>
        <Text type="secondary" className="text-xs sm:text-sm">
          {selectedGroup.members.length} member
          {selectedGroup.members.length !== 1 ? "s" : ""} in{" "}
          {selectedGroup.name}
        </Text>
      </div>

      {/* Members List */}
      <div className="space-y-2">
        {selectedGroup.members.map((member) => (
          <Card
            key={member.id || member.user_id}
            className="hover:shadow-sm transition-shadow"
            size="small"
            bodyStyle={{ padding: "8px 12px" }}
          >
            <div className="flex items-center justify-between">
              {/* Left side - Avatar and info */}
              <div className="flex items-center space-x-2 sm:space-x-3">
                {/* Avatar */}
                <div className="relative">
                  <Avatar
                    size="small"
                    className="w-8 h-8 sm:w-10 sm:h-10"
                    style={{
                      backgroundColor: isGoogleMail(member.user_id)
                        ? "#4285f4"
                        : "#1890ff",
                      fontSize: "12px",
                    }}
                  >
                    <span className="text-xs sm:text-sm">
                      {getInitials(member.name, member.user_id)}
                    </span>
                  </Avatar>
                </div>

                {/* Member info */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-start items-center space-x-1 mb-0.5">
                    <Text strong className="text-xs sm:text-sm">
                      {getDisplayName(member)}
                    </Text>
                    {isGoogleMail(member.user_id) && (
                      <div className="ml-1">
                        <GoogleOutlined
                          style={{
                            fontSize: "10px",
                            color: "#4285f4",
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {member.user_id && (
                    <div className="flex items-center space-x-1">
                      <MailOutlined className="text-gray-400 text-[10px]" />
                      <Text
                        type="secondary"
                        className="text-[10px] sm:text-xs truncate"
                      >
                        {member.user_id}
                      </Text>
                    </div>
                  )}
                </div>
              </div>

              {/* Right side - Status/Role */}
              <div className="hidden sm:block text-right">
                <Tag color="green" className="mb-0 text-xs">
                  Member
                </Tag>
                {member.id && (
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    ID: {member.id.slice(-6)}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Summary Stats */}
      <Card className="mt-3 sm:mt-4 bg-blue-50" size="small">
        <div className="grid grid-cols-2 gap-2 sm:gap-3 text-center">
          <div>
            <Text strong className="text-blue-600 block text-sm sm:text-base">
              {selectedGroup.members.length}
            </Text>
            <Text type="secondary" className="text-xs sm:text-sm">
              Total Members
            </Text>
          </div>
          <div>
            <Text strong className="text-blue-600 block text-sm sm:text-base">
              {
                selectedGroup.members.filter((m) => isGoogleMail(m.user_id))
                  .length
              }
            </Text>
            <Text type="secondary" className="text-xs sm:text-sm">
              Google Accounts
            </Text>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MembersTab;
