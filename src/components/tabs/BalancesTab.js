// components/tabs/BalancesTab.js
import React from "react";
import { Card, Typography, Tag, Space, Empty, Divider, Spin } from "antd";
import { CalculatorOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { useAppContext } from "../../contexts/AppContext";
import { useExpenses } from "../../hooks/useFirestore";

const { Text, Title } = Typography;

const BalancesTab = () => {
  const { selectedGroup } = useAppContext();
  const { expenses, loading } = useExpenses(selectedGroup?.id);

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
        description="No expenses to calculate balances"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

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

  // Calculate net balance
  Object.keys(balances).forEach((person) => {
    console.log(balances[person].paid - balances[person].owes);
    balances[person].balance = balances[person].paid - balances[person].owes;
  });

  // Separate creditors and debtors
  const creditors = Object.entries(balances)
    .filter(([, balance]) => balance.balance > 0.01)
    .sort(([, a], [, b]) => b.balance - a.balance);

  const debtors = Object.entries(balances)
    .filter(([, balance]) => balance.balance < -0.01)
    .sort(([, a], [, b]) => a.balance - b.balance);

  const evenMembers = Object.entries(balances).filter(
    ([, balance]) => Math.abs(balance.balance) <= 0.01
  );

  // Simple debt simplification - FIXED VERSION (Solution 2)
  const simplifyDebts = () => {
    const settlements = [];

    // Work with separate data structures instead of modifying balance objects
    let creditorsData = creditors.map(([id, balance]) => ({
      id,
      name: balance.name,
      amount: balance.balance,
    }));

    let debtorsData = debtors.map(([id, balance]) => ({
      id,
      name: balance.name,
      amount: Math.abs(balance.balance),
    }));

    while (creditorsData.length > 0 && debtorsData.length > 0) {
      const creditor = creditorsData[0];
      const debtor = debtorsData[0];

      const amount = Math.min(creditor.amount, debtor.amount);

      settlements.push({
        from: debtor.id,
        to: creditor.id,
        fromName: debtor.name,
        toName: creditor.name,
        amount: amount,
      });

      creditor.amount -= amount;
      debtor.amount -= amount;

      if (creditor.amount <= 0.01) {
        creditorsData.shift();
      }
      if (debtor.amount <= 0.01) {
        debtorsData.shift();
      }
    }

    return settlements;
  };

  const settlements = simplifyDebts();
  return (
    <div className="space-y-6">
      {/* Individual Balances */}
      <div className="text-center font-bold"> Individual Balances</div>
      <div className="space-y-4">
        {Object.entries(balances)
          .sort(([, a], [, b]) => b.balance - a.balance)
          .map(([person, balance]) => (
            <div
              key={person}
              className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border border-gray-100 rounded-lg"
            >
              <div className="flex-1">
                <Text strong className="text-base">
                  {balance.name}
                </Text>
                <div className="text-sm text-gray-500 mt-1">
                  <Space split={<span>|</span>}>
                    <span>Paid: ₹{balance.paid.toFixed(2)}</span>
                    <span>Owes: ₹{balance.owes.toFixed(2)}</span>
                  </Space>
                </div>
              </div>
              <div className="mt-2 sm:mt-0">
                <Tag
                  color={
                    balance.balance >= 0.01
                      ? "green"
                      : balance.balance <= -0.01
                      ? "red"
                      : "default"
                  }
                  className="text-sm font-medium"
                >
                  {balance.balance >= 0.01
                    ? "Gets back"
                    : balance.balance <= -0.01
                    ? "Owes"
                    : "Settled"}
                  {Math.abs(balance.balance) > 0.01 &&
                    ` ₹${Math.abs(balance.balance).toFixed(2)}`}
                </Tag>
              </div>
            </div>
          ))}
      </div>

      {/* Debt Simplification */}
      {/* <Card
        title={
          <div className="flex items-center">
            <CalculatorOutlined className="mr-2" />
            Simplified Settlements
          </div>
        }
      > */}
      <div className="flex items-center justify-center font-bold">
        <CalculatorOutlined className="mr-2" />
        Simplified Settlements
      </div>
      {settlements.length === 0 ? (
        <div className="text-center py-8">
          <Title level={4} className="text-green-600">
            🎉 All settled up!
          </Title>
          <Text type="secondary">Everyone's expenses are balanced</Text>
        </div>
      ) : (
        <div className="space-y-4">
          {settlements.map((settlement, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-blue-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <span className="font-bold text-[10px] md:text-lg">
                  {settlement.fromName || settlement.from.split("@")[0]}
                </span>
                <ArrowRightOutlined className="text-blue-500" />
                <span className="font-bold text-[10px] md:text-lg">
                  {settlement.toName || settlement.to.split("@")[0]}
                </span>
              </div>
              <Tag
                color="blue"
                className="text-[11px] md:text-base font-medium  "
              >
                ₹{settlement.amount.toFixed(2)}
              </Tag>
            </div>
          ))}

          <Divider />

          <div className="text-center">
            <Text type="secondary" className="text-sm">
              With these {settlements.length} transaction
              {settlements.length !== 1 ? "s" : ""}, everyone will be settled
              up!
            </Text>
          </div>
        </div>
      )}
      {/* </Card> */}

      {/* Summary Stats */}
      <Card title="Balance Summary">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-green-50 rounded-lg">
            <Text strong className="text-green-600 block text-lg">
              {creditors.length}
            </Text>
            <Text type="secondary">Getting money back</Text>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <Text strong className="text-red-600 block text-lg">
              {debtors.length}
            </Text>
            <Text type="secondary">Owe money</Text>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <Text strong className="text-gray-600 block text-lg">
              {evenMembers.length}
            </Text>
            <Text type="secondary">All settled</Text>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BalancesTab;
