// components/Profile.js
import React from "react";
import { Card, Avatar, Typography, Button, Divider } from "antd";
import {
  UserOutlined,
  MailOutlined,
  GoogleOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { useAppContext } from "../contexts/AppContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

const { Text, Title } = Typography;

const Profile = () => {
  const { currentUser } = useAppContext();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const isGoogleMail = currentUser?.email?.toLowerCase().includes("@gmail.com");

  // Get initials from name or email
  const getInitials = () => {
    if (currentUser?.displayName) {
      const nameParts = currentUser.displayName.trim().split(" ");
      if (nameParts.length >= 2) {
        return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
      }
      return nameParts[0][0].toUpperCase();
    }
    if (currentUser?.email) {
      return currentUser.email[0].toUpperCase();
    }
    return "U";
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-3 sm:mb-4">
        <Text className="text-sm sm:text-base font-semibold block mb-1">
          Profile
        </Text>
        <Text type="secondary" className="text-xs sm:text-sm">
          Your account information
        </Text>
      </div>

      {/* Profile Card */}
      <Card className="mb-3 sm:mb-4" size="small">
        <div className="flex flex-col items-center text-center py-4 sm:py-6">
          {/* Profile Image */}
          <Avatar
            size={80}
            src={currentUser?.photoURL}
            icon={<UserOutlined />}
            className="mb-3 sm:mb-4"
            style={{
              backgroundColor: isGoogleMail ? "#4285f4" : "#1890ff",
            }}
          >
            {!currentUser?.photoURL && (
              <span className="text-2xl">{getInitials()}</span>
            )}
          </Avatar>

          {/* Name */}
          <Title level={4} className="mb-1 sm:mb-2 text-base sm:text-lg">
            {currentUser?.displayName ||
              currentUser?.email?.split("@")[0] ||
              "User"}
          </Title>

          {/* Email */}
          <div className="flex items-center justify-center space-x-2 mb-2">
            <MailOutlined className="text-gray-400 text-xs sm:text-sm" />
            <Text type="secondary" className="text-xs sm:text-sm">
              {currentUser?.email}
            </Text>
          </div>

          {/* Google Badge */}
          {isGoogleMail && (
            <div className="flex items-center space-x-1 mt-1">
              <GoogleOutlined style={{ color: "#4285f4", fontSize: "14px" }} />
              <Text type="secondary" className="text-xs sm:text-sm">
                Google Account
              </Text>
            </div>
          )}
        </div>
      </Card>

      {/* Account Info */}
      <Card
        size="small"
        title={<span className="text-xs sm:text-sm">Account Information</span>}
      >
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Text className="text-xs sm:text-sm">Email</Text>
            <Text strong className="text-xs sm:text-sm">
              {currentUser?.email}
            </Text>
          </div>
          <Divider className="my-2" />
          {/* <div className="flex justify-between items-center">
            <Text className="text-xs sm:text-sm">User ID</Text>
            <Text type="secondary" className="text-[10px] sm:text-xs font-mono">
              {currentUser?.uid?.slice(0, 8)}...
            </Text>
          </div> */}
        </div>
      </Card>

      {/* Logout Button */}
      <div className="mt-4 sm:mt-6">
        <Button
          type="primary"
          danger
          icon={<LogoutOutlined />}
          onClick={handleLogout}
          block
          size="small"
          className="text-xs sm:text-sm"
        >
          Logout
        </Button>
      </div>
    </div>
  );
};

export default Profile;
