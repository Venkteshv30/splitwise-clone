// components/tabs/ExportTab.js
import React from "react";
import { Download, FileSpreadsheet, Share2, Loader2 } from "lucide-react";
import { useAppContext } from "../../contexts/AppContext";
import { useExpenses } from "../../hooks/useFirestore";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

const ExportTab = () => {
  const { selectedGroup } = useAppContext();
  const { expenses, loading } = useExpenses(selectedGroup?.id);
  const [isExporting, setIsExporting] = React.useState(false);
  const [isSharing, setIsSharing] = React.useState(false);

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

  const handleExportToExcel = async () => {
    try {
      setIsExporting(true);
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
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleShareSummary = async () => {
    try {
      setIsSharing(true);
      const data = prepareExportData();

      let summary = `📊 ${data.groupInfo.name} - Expense Summary\n\n`;
      summary += `💰 Total Spent: ₹${data.groupInfo.totalAmount.toFixed(2)}\n`;
      summary += `📝 Total Expenses: ${data.groupInfo.totalExpenses}\n`;
      summary += `👥 Members: ${data.groupInfo.members.length}\n\n`;

      summary += `💳 Balances:\n`;
      data.balances.forEach((balance) => {
        if (Math.abs(balance.balance) > 0.01) {
          const status = balance.balance > 0 ? "gets back" : "owes";
          summary += `• ${balance.person} ${status} ₹${Math.abs(
            balance.balance
          ).toFixed(2)}\n`;
        } else {
          summary += `• ${balance.person} is settled up ✅\n`;
        }
      });

      if (navigator.share) {
        await navigator.share({
          title: `${selectedGroup.name} - Expense Summary`,
          text: summary,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(summary);
      }
    } catch (error) {
      console.error("Share error:", error);
    } finally {
      setIsSharing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-4 sm:mb-6">
        <Download className="text-3xl sm:text-4xl text-foreground mb-2 sm:mb-3 mx-auto" />
        <p className="text-base sm:text-lg font-semibold block mb-1 text-foreground">
          Export Group Data
        </p>
        <p className="text-xs sm:text-sm text-muted-foreground block">
          Download or share a complete summary of all group expenses and
          balances
        </p>
      </div>

      <div className="space-y-3">
        {/* Export to Excel/CSV */}
        <Card className="border-border">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2 sm:space-x-3 flex-1">
                <FileSpreadsheet className="text-lg sm:text-xl text-green-400 flex-shrink-0" />
                <div>
                  <p className="text-xs sm:text-sm font-semibold block mb-0.5 text-foreground">
                    Export to Excel/CSV
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Download detailed expenses and balances in CSV format
                  </p>
                </div>
              </div>
              <Button
                onClick={handleExportToExcel}
                disabled={expenses.length === 0 || isExporting}
                size="sm"
                className="text-xs sm:text-sm w-full sm:w-auto"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-3 w-3" />
                    Download CSV
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Share Summary */}
        <Card className="border-border">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2 sm:space-x-3 flex-1">
                <Share2 className="text-lg sm:text-xl text-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs sm:text-sm font-semibold block mb-0.5 text-foreground">
                    Share Summary
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Share a quick summary via messaging apps or copy to clipboard
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleShareSummary}
                disabled={expenses.length === 0 || isSharing}
                size="sm"
                className="text-xs sm:text-sm w-full sm:w-auto"
              >
                {isSharing ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Sharing...
                  </>
                ) : (
                  <>
                    <Share2 className="mr-2 h-3 w-3" />
                    Share
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {expenses.length === 0 && (
        <div className="text-center mt-4 sm:mt-6 p-3 sm:p-4 bg-muted rounded-lg border border-border">
          <p className="text-xs sm:text-sm text-muted-foreground">
            No expenses to export yet. Add some expenses to enable export
            features.
          </p>
        </div>
      )}
    </div>
  );
};

export default ExportTab;
