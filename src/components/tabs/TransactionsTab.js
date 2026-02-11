// components/tabs/TransactionsTab.js
import React, { useState } from "react";
import {
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Empty,
  Typography,
  Divider,
  Card,
  Spin,
  Avatar,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useAppContext } from "../../contexts/AppContext";
import { useExpenses } from "../../hooks/useFirestore";

const { Option } = Select;
const { Text, Title } = Typography;

const TransactionsTab = () => {
  const { selectedGroup, currentUser } = useAppContext();
  const { expenses, loading, updateExpense, deleteExpense } = useExpenses(
    selectedGroup?.id
  );
  const [editingExpense, setEditingExpense] = useState(null);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteExpenseId, setDeleteExpenseId] = useState(null);
  const [form] = Form.useForm();

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    form.setFieldsValue({
      description: expense.description,
      amount: expense.amount,
      paidBy: expense.paidBy,
      sharedBy: expense.sharedBy,
    });
  };

  const handleSaveEdit = async (values) => {
    try {
      await updateExpense(editingExpense.id, values);
      setEditingExpense(null);
      form.resetFields();
    } catch (error) {
      console.error("Error updating expense:", error);
    }
  };

  const handleDelete = (expenseId) => {
    console.log("del called");
    setDeleteExpenseId(expenseId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      console.log("Deleting expense:", deleteExpenseId);
      await deleteExpense(deleteExpenseId);
      setSelectedExpense(null);
      setShowDeleteModal(false);
      setDeleteExpenseId(null);
      console.log("Expense deleted successfully");
    } catch (error) {
      console.error("Error deleting expense:", error);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteExpenseId(null);
    console.log("Delete cancelled");
  };

  const handleCancelEdit = () => {
    setEditingExpense(null);
    form.resetFields();
  };

  // Group expenses by date
  const groupExpensesByDate = (expenses) => {
    const grouped = {};
    expenses.forEach((expense) => {
      const date = expense.createdAt?.toDate
        ? expense.createdAt.toDate()
        : new Date(expense.createdAt);
      const dateKey = date.toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(expense);
    });
    return grouped;
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year:
          date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
      });
    }
  };

  // Get expense category icon
  const getExpenseIcon = (description) => {
    const desc = description.toLowerCase();
    if (
      desc.includes("food") ||
      desc.includes("dinner") ||
      desc.includes("lunch") ||
      desc.includes("restaurant")
    ) {
      return "🍽️";
    } else if (
      desc.includes("fuel") ||
      desc.includes("gas") ||
      desc.includes("petrol")
    ) {
      return "⛽";
    } else if (
      desc.includes("cab") ||
      desc.includes("uber") ||
      desc.includes("taxi") ||
      desc.includes("transport")
    ) {
      return "🚗";
    } else if (desc.includes("movie") || desc.includes("entertainment")) {
      return "🎬";
    } else if (desc.includes("grocery") || desc.includes("shopping")) {
      return "🛒";
    } else {
      return "💰";
    }
  };

  // Get member name from email
  const getMemberName = (email) => {
    const member = selectedGroup?.members?.find((m) => m.user_id === email);
    return member?.name || email.split("@")[0];
  };

  // Get month and day from date
  const getDateParts = (expense) => {
    const date = expense.createdAt?.toDate
      ? expense.createdAt.toDate()
      : new Date(expense.createdAt);
    const month = date.toLocaleDateString("en-US", { month: "short" });
    const day = date.getDate().toString().padStart(2, "0");
    return { month, day };
  };

  // Calculate individual amounts
  const calculateAmounts = (expense) => {
    const shareAmount = expense.amount / expense.sharedBy?.length || 1;
    const isCurrentUserPayer = expense.paidBy === currentUser?.email;
    const isCurrentUserInvolved = expense.sharedBy?.includes(
      currentUser?.email
    );

    let youLent = 0;
    let youBorrowed = 0;

    if (isCurrentUserPayer && isCurrentUserInvolved) {
      youLent = expense.amount - shareAmount; // What others owe you
    } else if (isCurrentUserPayer && !isCurrentUserInvolved) {
      youLent = expense.amount; // You paid but not involved in split
    } else if (!isCurrentUserPayer && isCurrentUserInvolved) {
      youBorrowed = shareAmount; // You owe the payer
    }

    return { youLent, youBorrowed, shareAmount };
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Spin />
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <Empty
        description="No transactions yet"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      >
        <Button type="primary" onClick={() => {}}>
          Add your first expense
        </Button>
      </Empty>
    );
  }

  // Show expense detail view
  if (selectedExpense) {
    const { youLent, youBorrowed, shareAmount } =
      calculateAmounts(selectedExpense);

    return (
      <>
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center mb-3 sm:mb-4 py-2 border-b">
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => setSelectedExpense(null)}
              className="mr-2"
              size="small"
            />
            <Text className="text-sm sm:text-base font-semibold m-0">
              Transaction Details
            </Text>
          </div>

          {/* Main Details */}
          <div className="py-3 sm:py-4">
            <div className="text-center mb-4 sm:mb-6">
              <div className="text-2xl sm:text-4xl mb-2 sm:mb-3">
                {getExpenseIcon(selectedExpense.description)}
              </div>
              <Text className="block text-base sm:text-lg font-semibold mb-1 sm:mb-2">
                {selectedExpense.description}
              </Text>
              <Text className="text-base sm:text-xl text-green-600 font-semibold">
                ₹{selectedExpense.amount?.toFixed(2)}
              </Text>
            </div>

            {/* Paid By */}
            <Card className="mb-3 sm:mb-4" size="small" title={<span className="text-xs sm:text-sm">Paid By</span>}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Avatar size="small" icon={<UserOutlined />} />
                  <Text strong className="text-xs sm:text-sm">{getMemberName(selectedExpense.paidBy)}</Text>
                </div>
                <Text className="text-sm sm:text-base">
                  ₹{selectedExpense.amount?.toFixed(2)}
                </Text>
              </div>
            </Card>

            {/* Split Details */}
            <Card size="small" title={<span className="text-xs sm:text-sm">Split Between</span>}>
              <div className="space-y-2">
                {selectedExpense.sharedBy?.map((person) => (
                  <div
                    key={person}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      <Avatar size="small" icon={<UserOutlined />} />
                      <Text strong className="text-xs sm:text-sm">
                        {person === currentUser?.email
                          ? "You"
                          : getMemberName(person)}
                      </Text>
                    </div>
                    <div className="text-right">
                      <Text className="text-sm sm:text-base">₹{shareAmount.toFixed(2)}</Text>
                      {person === currentUser?.email && youBorrowed > 0 && (
                        <div className="text-[10px] sm:text-xs text-red-500">you borrowed</div>
                      )}
                      {person === currentUser?.email && youLent > 0 && (
                        <div className="text-[10px] sm:text-xs text-green-500">you lent</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Your Summary */}
            {(youLent > 0 || youBorrowed > 0) && (
              <Card className="mt-3 sm:mt-4 bg-blue-50" size="small">
                <div className="text-center">
                  <Text className="text-xs sm:text-sm">Your Balance</Text>
                  <div className="text-base sm:text-lg font-semibold mt-1 sm:mt-2">
                    {youLent > 0 && (
                      <Text className="text-green-600">
                        +₹{youLent.toFixed(2)} (you lent)
                      </Text>
                    )}
                    {youBorrowed > 0 && (
                      <Text className="text-red-600">
                        -₹{youBorrowed.toFixed(2)} (you borrowed)
                      </Text>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Actions */}
            <div className="flex justify-center space-x-3 sm:space-x-4 mt-4 sm:mt-6">
              <Button
                icon={<EditOutlined />}
                onClick={() => handleEdit(selectedExpense)}
                size="small"
                className="text-xs sm:text-sm"
              >
                Edit
              </Button>
              <Button
                icon={<DeleteOutlined />}
                danger
                onClick={() => handleDelete(selectedExpense.id)}
                size="small"
                className="text-xs sm:text-sm"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Edit Expense Modal - Detail View */}
        <Modal
          title="Edit Expense"
          open={!!editingExpense}
          onOk={() => form.submit()}
          onCancel={handleCancelEdit}
          width={600}
          okText="Save Changes"
          zIndex={9999}
          centered
          destroyOnClose={true}
          getContainer={() => document.body}
          maskClosable={false}
        >
          <Form form={form} layout="vertical" onFinish={handleSaveEdit}>
            <Form.Item
              name="description"
              label="Description"
              rules={[{ required: true, message: "Please enter description" }]}
            >
              <Input placeholder="What was this expense for?" />
            </Form.Item>

            <Form.Item
              name="amount"
              label="Amount"
              rules={[{ required: true, message: "Please enter amount" }]}
            >
              <InputNumber
                className="w-full"
                min={0}
                placeholder="0.00"
                addonBefore="₹"
              />
            </Form.Item>

            <Form.Item
              name="paidBy"
              label="Paid By"
              rules={[{ required: true, message: "Please select who paid" }]}
            >
              <Select placeholder="Who paid for this?">
                {selectedGroup?.members?.map((member) => (
                  <Option key={member.user_id} value={member.user_id}>
                    {member.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="sharedBy"
              label="Shared By"
              rules={[
                {
                  required: true,
                  message: "Please select who shares this expense",
                },
              ]}
            >
              <Select mode="multiple" placeholder="Who should split this?">
                {selectedGroup?.members?.map((member) => (
                  <Option key={member.user_id} value={member.user_id}>
                    {member.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        </Modal>

        {/* Delete Confirmation Modal - Detail View */}
        <Modal
          title="Delete Expense"
          open={showDeleteModal}
          onOk={confirmDelete}
          onCancel={cancelDelete}
          okText="Delete"
          okType="danger"
          cancelText="Cancel"
          zIndex={9999}
          centered
          destroyOnClose
          getContainer={() => document.body}
          maskClosable={false}
        >
          <p>
            Are you sure you want to delete this expense? This action cannot be
            undone.
          </p>
        </Modal>
      </>
    );
  }

  // Show main list view
  const groupedExpenses = groupExpensesByDate(expenses);
  const sortedDates = Object.keys(groupedExpenses).sort(
    (a, b) => new Date(b) - new Date(a)
  );

  return (
    <div className="space-y-4">
      {sortedDates.map((dateKey) => (
        <div key={dateKey}>
          {/* Date Header */}
          <div className="flex flex-col items-center mb-2">
            <Text className="text-gray-600 m-0 text-xs sm:text-sm font-medium">
              {formatDate(dateKey)}
            </Text>
            <Divider className="flex-1 m-0 mt-1" />
          </div>

          {/* Expenses for this date */}
          <div className="space-y-2">
            {groupedExpenses[dateKey].map((expense) => {
              const { month, day } = getDateParts(expense);
              const { youLent, youBorrowed } = calculateAmounts(expense);
              const isPaidByCurrentUser = expense.paidBy === currentUser?.email;

              return (
                <div
                  key={expense.id}
                  className="flex items-center py-2 px-2 sm:px-3 bg-white rounded cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setSelectedExpense(expense)}
                >
                  {/* Date Column */}
                  <div className="text-center mr-2 sm:mr-3 min-w-[24px] sm:min-w-[40px]">
                    <div className="text-[9px] sm:text-[10px] text-gray-500 uppercase leading-tight">
                      {month}
                    </div>
                    <div className="text-xs sm:text-sm font-semibold leading-tight">
                      {day}
                    </div>
                  </div>

                  {/* Icon */}
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-full flex items-center justify-center text-sm sm:text-base mr-2 sm:mr-3 flex-shrink-0">
                    {getExpenseIcon(expense.description)}
                  </div>

                  {/* Description Column */}
                  <div className="flex-1 min-w-0">
                    <Text
                      strong
                      className="block truncate text-xs sm:text-sm font-medium"
                    >
                      {expense.description}
                    </Text>
                    <Text type="secondary" className="text-[10px] sm:text-xs">
                      {isPaidByCurrentUser
                        ? `You paid ₹${expense.amount?.toFixed(2)}`
                        : `${getMemberName(
                            expense.paidBy
                          )} paid ₹${expense.amount?.toFixed(2)}`}
                    </Text>
                  </div>

                  {/* Amount Column */}
                  <div className="text-right min-w-[70px] sm:min-w-[80px] flex-shrink-0">
                    {youLent > 0 && (
                      <>
                        <div className="text-[10px] sm:text-xs text-gray-500 leading-tight">you lent</div>
                        <div className="text-xs sm:text-sm font-semibold text-green-600 leading-tight">
                          ₹{youLent.toFixed(2)}
                        </div>
                      </>
                    )}
                    {youBorrowed > 0 && (
                      <>
                        <div className="text-[10px] sm:text-xs text-gray-500 leading-tight">
                          you borrowed
                        </div>
                        <div className="text-xs sm:text-sm font-semibold text-red-600 leading-tight">
                          ₹{youBorrowed.toFixed(2)}
                        </div>
                      </>
                    )}
                    {youLent === 0 && youBorrowed === 0 && (
                      <>
                        <div className="text-[10px] sm:text-xs text-gray-500 leading-tight">
                          not involved
                        </div>
                        <div className="text-xs sm:text-sm font-semibold text-gray-400 leading-tight">
                          ₹0.00
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Edit Expense Modal for main list view */}
      <Modal
        title="Edit Expense"
        open={!!editingExpense}
        onOk={() => form.submit()}
        onCancel={handleCancelEdit}
        width={600}
        okText="Save Changes"
        zIndex={9999}
        centered
        destroyOnClose={true}
        getContainer={() => document.body}
        maskClosable={false}
      >
        <Form form={form} layout="vertical" onFinish={handleSaveEdit}>
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: "Please enter description" }]}
          >
            <Input placeholder="What was this expense for?" />
          </Form.Item>

          <Form.Item
            name="amount"
            label="Amount"
            rules={[{ required: true, message: "Please enter amount" }]}
          >
            <InputNumber
              className="w-full"
              min={0}
              placeholder="0.00"
              addonBefore="₹"
            />
          </Form.Item>

          <Form.Item
            name="paidBy"
            label="Paid By"
            rules={[{ required: true, message: "Please select who paid" }]}
          >
            <Select placeholder="Who paid for this?">
              {selectedGroup?.members?.map((member) => (
                <Option key={member.user_id} value={member.user_id}>
                  {member.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="sharedBy"
            label="Shared By"
            rules={[
              {
                required: true,
                message: "Please select who shares this expense",
              },
            ]}
          >
            <Select mode="multiple" placeholder="Who should split this?">
              {selectedGroup?.members?.map((member) => (
                <Option key={member.user_id} value={member.user_id}>
                  {member.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal for main list view */}
      <Modal
        title="Delete Expense"
        open={showDeleteModal}
        onOk={confirmDelete}
        onCancel={cancelDelete}
        okText="Delete"
        okType="danger"
        cancelText="Cancel"
        zIndex={9999}
        centered
        destroyOnClose
        getContainer={() => document.body}
        maskClosable={false}
      >
        <p>
          Are you sure you want to delete this expense? This action cannot be
          undone.
        </p>
      </Modal>
    </div>
  );
};

export default TransactionsTab;
