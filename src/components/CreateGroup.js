// components/CreateGroup.js
import React, { useState } from "react";
import {
  Button,
  Card,
  Typography,
  Form,
  Input,
  Space,
  message,
  Modal,
  List,
  Avatar,
  Popconfirm,
} from "antd";
import { AiOutlineArrowLeft, AiOutlinePlus, AiOutlineUser, AiOutlineDelete } from "react-icons/ai";
import { useAppContext } from "../contexts/AppContext";
import { useGroups } from "../hooks/useFirestore";
import { sendNotification } from "../utils/helperMethods";
import { generateGroupAvatar } from "../utils/groupAvatar";

const { Title } = Typography;

const CreateGroup = () => {
  const [form] = Form.useForm();
  const [userForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [members, setMembers] = useState([]);

  const { currentUser, setCurrentPage } = useAppContext();
  const { createGroup } = useGroups(currentUser?.email); // Use email instead of uid
  console.log(currentUser);
  const validateEmail = (email) => {
    if (!email) return true; // Email is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const generateRandomId = () => {
    return "user_" + Math.random().toString(36).substr(2, 9);
  };

  const handleAddUser = async () => {
    try {
      // First validate the form fields
      const values = await userForm.validateFields();
      const { name, email } = values;

      // Validate email if provided
      if (email && !validateEmail(email)) {
        message.error("Please enter a valid email address");
        return;
      }

      // Check if user already exists (by name or email)
      let userExists = members.some(
        (member) =>
          member.name.toLowerCase() === name.toLowerCase() ||
          (email &&
            member.email &&
            member.email.toLowerCase() === email.toLowerCase())
      );

      if (userExists) {
        message.error("User with this name or email already exists");
        sendNotification(
          "error",
          "User with this name or email already exists"
        );
        return;
      }

      // Check if conflicting with current user
      if (
        email === currentUser?.email ||
        name.toLowerCase() === currentUser?.displayName?.toLowerCase()
      ) {
        message.error(
          "User with this name or email conflicts with your name/email"
        );
        sendNotification(
          "error",
          "User with this name or email conflicts with your name/email"
        );

        return;
      }

      const isGoogleUser = (email && email.includes("@gmail.com")) ?? false;

      const newMember = {
        id: Date.now().toString(),
        user_id: isGoogleUser ? email.trim() : generateRandomId(),
        name: name.trim(),
        email: email?.trim() || null,
        is_google_email: isGoogleUser,
      };

      setMembers([...members, newMember]);
      userForm.resetFields();
      setIsModalVisible(false);
      message.success(`${name} added to the group`);
    } catch (errorInfo) {
      // This handles form validation errors
      console.log("Form validation failed:", errorInfo);
      // The form will automatically show field-level validation errors
    }
  };

  console.log("members ", members);

  const handleRemoveUser = (userId) => {
    setMembers(members.filter((member) => member.id !== userId));
    message.success("User removed from group");
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // Process members for Firestore
      const processedMembers = members.map((member) => ({
        user_id: member.email || member.name, // Use email as ID if available, otherwise name
        name: member.name,
        email: member.email,
        is_google_email: member.is_google_email,
      }));

      // Add creator as a member
      processedMembers.unshift({
        user_id: currentUser.email,
        name: currentUser.displayName || currentUser.email,
        email: currentUser.email,
        is_google_email: true,
      });

      // Create memberIds array for efficient querying
      const memberIds = processedMembers.map((member) => member.user_id);

      // Generate group avatar pattern
      const avatarStyle = generateGroupAvatar(values.name);

      const groupData = {
        name: values.name,
        creator: currentUser.email,
        createdBy: currentUser.email,
        members: processedMembers,
        memberIds: memberIds, // For efficient Firestore queries
        avatarColor: avatarStyle.backgroundColor,
        avatarPattern: avatarStyle.patternColor,
      };

      await createGroup(groupData);
      setCurrentPage("groups");
    } catch (error) {
      console.error("Error creating group:", error);
      message.error("Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Button
          type="link"
          icon={<AiOutlineArrowLeft />}
          onClick={() => setCurrentPage("groups")}
          className="p-0 mb-2"
        >
          Back to Groups
        </Button>
        <Title level={2}>Create New Group</Title>
      </div>

      <Card>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="Group Name"
            rules={[
              { required: true, message: "Please enter group name" },
              { min: 2, message: "Group name must be at least 2 characters" },
            ]}
          >
            <Input
              placeholder="Enter group name (e.g., Trip to Goa, Apartment Expenses)"
              size="large"
            />
          </Form.Item>

          <Form.Item label="Group Members">
            <div className="mb-4">
              <Button
                type="dashed"
                icon={<AiOutlinePlus />}
                onClick={() => setIsModalVisible(true)}
                size="large"
                className="w-full"
              >
                Add Member
              </Button>
            </div>

            {members.length > 0 && (
              <Card size="small" className="bg-gray-50">
                <List
                  dataSource={members}
                  renderItem={(member) => (
                    <List.Item
                      actions={[
                        <Popconfirm
                          title="Remove this member?"
                          onConfirm={() => handleRemoveUser(member.id)}
                          okText="Yes"
                          cancelText="No"
                        >
                          <Button
                            type="text"
                            danger
                            icon={<AiOutlineDelete />}
                            size="small"
                          />
                        </Popconfirm>,
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<Avatar icon={<AiOutlineUser />} />}
                        title={member.name}
                        description={
                          member.email ? (
                            <span>
                              {member.email}
                              {member.is_google_email && (
                                <span className="text-green-600 ml-2">
                                  • Gmail
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-gray-500">
                              No email provided
                            </span>
                          )
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            )}
          </Form.Item>

          <Form.Item className="mb-0">
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={loading}
              >
                Create Group
              </Button>
              <Button
                onClick={() => setCurrentPage("groups")}
                size="large"
                disabled={loading}
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* Add User Modal */}
      <Modal
        title="Add Member to Group"
        open={isModalVisible}
        onOk={handleAddUser}
        onCancel={() => {
          setIsModalVisible(false);
          userForm.resetFields();
        }}
        okText="Add Member"
        cancelText="Cancel"
      >
        <Form form={userForm} layout="vertical">
          <Form.Item
            name="name"
            label="Name"
            rules={[
              { required: true, message: "Please enter member's name" },
              { min: 2, message: "Name must be at least 2 characters" },
            ]}
          >
            <Input placeholder="Enter member's name" size="large" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email (Optional)"
            rules={[
              { type: "email", message: "Please enter a valid email address" },
            ]}
          >
            <Input placeholder="Enter email address (optional)" size="large" />
          </Form.Item>

          <div className="text-sm text-gray-600">
            <p>• Name is required for all members</p>
            <p>• Email is optional but recommended for account verification</p>
            <p>• Gmail addresses will be marked as verified accounts</p>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default CreateGroup;
