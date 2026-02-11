// components/GroupDetail.js
import React from "react";
import { Button, Typography, Tabs } from "antd";
import { ArrowLeftOutlined, PlusOutlined } from "@ant-design/icons";
import { useAppContext } from "../contexts/AppContext";
import TransactionsTab from "./tabs/TransactionsTab";
import TotalTab from "./tabs/TotalTab";
import BalancesTab from "./tabs/BalancesTab";
import ExportTab from "./tabs/ExportTab";
import MembersTab from "./tabs/MembersTab";

const { Title } = Typography;
const { TabPane } = Tabs;

const GroupDetail = () => {
  const { selectedGroup, setCurrentPage } = useAppContext();

  if (!selectedGroup) {
    return (
      <div className="text-center py-8">
        <Title level={3}>No group selected</Title>
        <Button type="primary" onClick={() => setCurrentPage("groups")}>
          Go to Groups
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col overflow-hidden">
      {/* Header - Fixed */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 space-y-3 sm:space-y-0 flex-shrink-0">
        <div>
          <Button
            type="link"
            icon={<ArrowLeftOutlined />}
            onClick={() => setCurrentPage("groups")}
            className="p-0 mb-1 sm:mb-2 text-xs sm:text-base"
            size="small"
          >
            Back to Groups
          </Button>
          <Title level={2} className="mb-1 text-lg sm:text-2xl">
            {selectedGroup.name}
          </Title>
          <div className="text-gray-500 text-xs sm:text-sm">
            {selectedGroup.members?.length || 0} members
          </div>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCurrentPage("addExpense")}
          size="small"
          className="text-xs sm:text-base sm:h-auto h-8"
        >
          Add Expense
        </Button>
      </div>

      {/* Tabs - Fixed Header, Scrollable Content */}
      <div className="bg-white rounded-lg shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden">
        <Tabs
          defaultActiveKey="transactions"
          className="group-detail-tabs"
          type="line"
          tabBarStyle={{
            margin: 0,
            padding: '0 8px',
          }}
          moreIcon={null}
        >
          <TabPane tab="Transactions" key="transactions">
            <div className="tab-content-scrollable">
              <TransactionsTab />
            </div>
          </TabPane>
          <TabPane tab="Total" key="total">
            <div className="tab-content-scrollable">
              <TotalTab />
            </div>
          </TabPane>
          <TabPane tab="Balances" key="balances">
            <div className="tab-content-scrollable">
              <BalancesTab />
            </div>
          </TabPane>
          <TabPane tab="Members" key="members">
            <div className="tab-content-scrollable">
              <MembersTab />
            </div>
          </TabPane>
          <TabPane tab="Export" key="export">
            <div className="tab-content-scrollable">
              <ExportTab />
            </div>
          </TabPane>
        </Tabs>
      </div>
    </div>
  );
};

export default GroupDetail;
