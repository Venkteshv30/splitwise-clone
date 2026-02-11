// components/tabs/TotalTab.js
import React from "react";
import {
  Card,
  Statistic,
  Avatar,
  Typography,
  Empty,
  Spin,
  Divider,
} from "antd";
import { DollarOutlined, UserOutlined } from "@ant-design/icons";
import { useAppContext } from "../../contexts/AppContext";
import { useExpenses } from "../../hooks/useFirestore";

const { Text } = Typography;

const TotalTab = () => {
  const { selectedGroup } = useAppContext();
  const { expenses, loading } = useExpenses(selectedGroup?.id);

  const memberNameUserIdMapping = {};
  selectedGroup?.members?.forEach(
    (m) => (memberNameUserIdMapping[m?.user_id] = m?.name)
  );
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
        description="No expenses to calculate totals"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  // Calculate total amount
  const totalAmount = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

  // Calculate person-wise totals (amount they paid)
  const personTotals = {};
  expenses.forEach((expense) => {
    if (expense.paidBy && expense.amount) {
      // Since paidBy is always one user, not an array
      const person = expense.paidBy;
      personTotals[person] = (personTotals[person] || 0) + expense.amount;
    }
  });

  // Calculate date-wise spending
  const dateWiseSpend = {};
  expenses.forEach((expense) => {
    if (expense.createdAt && expense.amount) {
      const dateObj = expense.createdAt.toDate
        ? expense.createdAt.toDate()
        : new Date(expense.createdAt);
      const dateStr = dateObj.toDateString();
      dateWiseSpend[dateStr] = (dateWiseSpend[dateStr] || 0) + expense.amount;
    }
  });

  // Helper function to display person name (extract name from email if needed)
  const getDisplayName = (person) => {
    // If person is an email, show part before @
    if (person && person.includes("@")) {
      return person.split("@")[0];
    }
    return person || "Unknown";
  };

  return (
    <div className="space-y-4">
      {/* Total Group Spending */}
      <Card className="text-center" size="small">
        <Statistic
          title={<span className="text-xs sm:text-sm">Total Group Spending</span>}
          value={totalAmount}
          prefix="₹"
          valueStyle={{ color: "#3f8600", fontSize: "1.5rem" }}
          suffix={
            <div className="text-xs text-gray-500 mt-1">
              across {expenses.length} transaction
              {expenses.length !== 1 ? "s" : ""}
            </div>
          }
        />
      </Card>

      {/* Spending by Person */}
      <Card
        size="small"
        title={
          <div className="flex items-center text-xs sm:text-sm">
            <DollarOutlined className="mr-2" />
            Amount Paid by Each Person
          </div>
        }
      >
        {Object.keys(personTotals).length === 0 ? (
          <Empty description="No payment information available" />
        ) : (
          <div className="space-y-0">
            {Object.entries(personTotals)
              .sort(([, a], [, b]) => b - a) // Sort by amount descending
              .map(([person, amount], index, array) => (
                <div key={person}>
                  <div className="flex items-center justify-between py-2 px-1">
                    <div className="flex items-center space-x-2">
                      <Text strong className="text-xs sm:text-sm">
                        {getDisplayName(memberNameUserIdMapping[person])}
                      </Text>
                    </div>
                    <Text strong className="text-xs sm:text-sm text-green-600">
                      ₹{amount.toFixed(2)}
                    </Text>
                  </div>
                  {index < array.length - 1 && <Divider className="my-0" />}
                </div>
              ))}
          </div>
        )}
      </Card>
      {/* Date-wise Spending */}
      <Card size="small" title={<span className="text-xs sm:text-sm">Date-wise Spending Summary</span>}>
        {Object.keys(dateWiseSpend).length === 0 ? (
          <Empty description="No date information available" />
        ) : (
          <div className="space-y-2">
            {Object.entries(dateWiseSpend)
              .sort(([a], [b]) => new Date(b) - new Date(a)) // Sort by date descending
              .map(([date, amount]) => (
                <div
                  key={date}
                  className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-b-0"
                >
                  <Text className="text-xs sm:text-sm">
                    {new Date(date).toLocaleDateString("en-IN", {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </Text>
                  <Text strong className="text-xs sm:text-sm text-green-600">
                    ₹{amount.toFixed(2)}
                  </Text>
                </div>
              ))}
            <div className="pt-2 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <Text strong className="text-xs sm:text-sm">Total</Text>
                <Text strong className="text-sm sm:text-base text-green-600">
                  ₹
                  {Object.values(dateWiseSpend)
                    .reduce((sum, amount) => sum + amount, 0)
                    .toFixed(2)}
                </Text>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default TotalTab;
