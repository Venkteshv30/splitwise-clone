// components/tabs/ExportTab.js
import React from "react";
import { Button, Typography, Card, Space, message } from "antd";
import {
  ExportOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";
import { useAppContext } from "../../contexts/AppContext";
import { useExpenses } from "../../hooks/useFirestore";

const { Title, Text } = Typography;

const ExportTab = () => {
  const { selectedGroup } = useAppContext();
  const { expenses } = useExpenses(selectedGroup?.id);

  // Function to prepare data for export
  const prepareExportData = () => {
    // Calculate balances
    const balances = {};
    selectedGroup?.members?.forEach((member) => {
      balances[member.user_id] = {
        paid: 0,
        owes: 0,
        balance: 0,
        name: member?.name,
      };
    });

    expenses.forEach((expense) => {
      if (!expense.amount || !expense.paidBy || !expense.sharedBy) return;

      const shareAmount = expense.amount / expense.sharedBy.length;

      // Add to paid amount for the single payer
      if (balances[expense.paidBy]) {
        balances[expense.paidBy].paid += expense.amount;
      }

      // Add to owes amount for sharers
      expense.sharedBy.forEach((sharer) => {
        if (balances[sharer]) {
          balances[sharer].owes += shareAmount;
        }
      });
    });

    Object.keys(balances).forEach((person) => {
      balances[person].balance = balances[person].paid - balances[person].owes;
    });

    return {
      groupInfo: {
        name: selectedGroup.name,
        members: selectedGroup.members,
        totalExpenses: expenses.length,
        totalAmount: expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0),
      },
      expenses: expenses.map((exp) => {
        // Find the payer's name
        const payer = selectedGroup?.members?.find(
          (member) => member.user_id === exp.paidBy
        );
        const payerName = payer?.name || exp.paidBy?.split("@")[0] || "Unknown";

        // Find the sharers' names
        const sharerNames = exp.sharedBy
          ? exp.sharedBy
              .map((sharerId) => {
                const sharer = selectedGroup?.members?.find(
                  (member) => member.user_id === sharerId
                );
                return sharer?.name || sharerId?.split("@")[0] || "Unknown";
              })
              .join(", ")
          : "N/A";

        return {
          date: exp.createdAt
            ? (exp.createdAt.toDate
                ? exp.createdAt.toDate()
                : new Date(exp.createdAt)
              ).toLocaleDateString()
            : "N/A",
          description: exp.description || "N/A",
          amount: exp.amount || 0,
          paidBy: payerName,
          sharedBy: sharerNames,
        };
      }),
      balances: Object.entries(balances).map(([person, balance]) => {
        const member = selectedGroup?.members?.find(
          (m) => m.user_id === person
        );
        return {
          person: member?.name || person.split("@")[0] || "Unknown",
          email: person,
          paid: balance.paid,
          owes: balance.owes,
          balance: balance.balance,
        };
      }),
    };
  };

  const handleExportToExcel = () => {
    try {
      const data = prepareExportData();

      // Create CSV content
      let csvContent = "";

      // Group Info
      csvContent += "GROUP SUMMARY\n";
      csvContent += `Group Name,${data.groupInfo.name}\n`;
      csvContent += `Total Members,${data.groupInfo.members.length}\n`;
      csvContent += `Total Expenses,${data.groupInfo.totalExpenses}\n`;
      csvContent += `Total Amount,${data.groupInfo.totalAmount.toFixed(2)}\n\n`;

      // Expenses
      csvContent += "EXPENSES\n";
      csvContent += "Date,Description,Amount,Paid By,Shared By\n";
      data.expenses.forEach((expense) => {
        csvContent += `${expense.date},"${
          expense.description
        }",${expense.amount.toFixed(2)},"${expense.paidBy}","${
          expense.sharedBy
        }"\n`;
      });
      csvContent += "\n";

      // Balances
      csvContent += "BALANCES\n";
      csvContent += "Person,Email,Paid,Owes,Net Balance\n";
      data.balances.forEach((balance) => {
        csvContent += `${balance.person},${
          balance.email
        },${balance.paid.toFixed(2)},${balance.owes.toFixed(
          2
        )},${balance.balance.toFixed(2)}\n`;
      });

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `${selectedGroup.name.replace(/[^a-z0-9]/gi, "_")}_expenses.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      message.success("Export completed successfully!");
    } catch (error) {
      console.error("Export error:", error);
      message.error("Failed to export data");
    }
  };

  const handleShareSummary = () => {
    const data = prepareExportData();

    let summary = `📊 ${data.groupInfo.name} - Expense Summary\n\n`;
    summary += `💰 Total Spent: ${data.groupInfo.totalAmount.toFixed(2)}\n`;
    summary += `📝 Total Expenses: ${data.groupInfo.totalExpenses}\n`;
    summary += `👥 Members: ${data.groupInfo.members.length}\n\n`;

    summary += `💳 Balances:\n`;
    data.balances.forEach((balance) => {
      if (Math.abs(balance.balance) > 0.01) {
        const status = balance.balance > 0 ? "gets back" : "owes";
        summary += `• ${balance.person} ${status} ${Math.abs(
          balance.balance
        ).toFixed(2)}\n`;
      } else {
        summary += `• ${balance.person} is settled up ✅\n`;
      }
    });

    if (navigator.share) {
      navigator
        .share({
          title: `${selectedGroup.name} - Expense Summary`,
          text: summary,
        })
        .catch(console.error);
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard
        .writeText(summary)
        .then(() => {
          message.success("Summary copied to clipboard!");
        })
        .catch(() => {
          message.error("Failed to copy summary");
        });
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-4 sm:mb-6">
        <ExportOutlined className="text-3xl sm:text-4xl text-blue-500 mb-2 sm:mb-3" />
        <Text className="text-base sm:text-lg font-semibold block mb-1">
          Export Group Data
        </Text>
        <Text type="secondary" className="text-xs sm:text-sm block">
          Download or share a complete summary of all group expenses and
          balances
        </Text>
      </div>

      <div className="space-y-3">
        {/* Export to Excel/CSV */}
        <Card size="small">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2 sm:space-x-3 flex-1">
              <FileExcelOutlined className="text-lg sm:text-xl text-green-600" />
              <div>
                <Text strong className="text-xs sm:text-sm block mb-0.5">
                  Export to Excel/CSV
                </Text>
                <Text type="secondary" className="text-[10px] sm:text-xs">
                  Download detailed expenses and balances in CSV format
                </Text>
              </div>
            </div>
            <Button
              type="primary"
              icon={<ExportOutlined />}
              onClick={handleExportToExcel}
              disabled={expenses.length === 0}
              size="small"
              className="text-xs sm:text-sm"
            >
              Download CSV
            </Button>
          </div>
        </Card>

        {/* Share Summary */}
        <Card size="small">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2 sm:space-x-3 flex-1">
              <ExportOutlined className="text-lg sm:text-xl text-blue-600" />
              <div>
                <Text strong className="text-xs sm:text-sm block mb-0.5">
                  Share Summary
                </Text>
                <Text type="secondary" className="text-[10px] sm:text-xs">
                  Share a quick summary via messaging apps or copy to clipboard
                </Text>
              </div>
            </div>
            <Button
              icon={<ExportOutlined />}
              onClick={handleShareSummary}
              disabled={expenses.length === 0}
              size="small"
              className="text-xs sm:text-sm"
            >
              Share
            </Button>
          </div>
        </Card>
      </div>

      {expenses.length === 0 && (
        <div className="text-center mt-4 sm:mt-6 p-3 sm:p-4 bg-gray-50 rounded">
          <Text type="secondary" className="text-xs sm:text-sm">
            No expenses to export yet. Add some expenses to enable export
            features.
          </Text>
        </div>
      )}
    </div>
  );
};

export default ExportTab;
