// components/ChartsPage.js
import React, { useMemo, useEffect, useState } from "react";
import {
  ArrowLeft,
  Loader2,
  TrendingUp,
  PieChart,
  BarChart3,
  Calendar,
} from "lucide-react";
import { useAppContext } from "../contexts/AppContext";
import { useExpenses } from "../hooks/useFirestore";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const ChartsPage = () => {
  const { selectedGroup, setCurrentPage } = useAppContext();
  const { expenses, loading } = useExpenses(selectedGroup?.id);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Get expense category from description
  const getCategory = (description) => {
    const desc = description?.toLowerCase() || "";
    if (
      desc.includes("food") ||
      desc.includes("dinner") ||
      desc.includes("lunch") ||
      desc.includes("restaurant") ||
      desc.includes("breakfast")
    ) {
      return "Food & Dining";
    } else if (
      desc.includes("fuel") ||
      desc.includes("gas") ||
      desc.includes("petrol")
    ) {
      return "Transport";
    } else if (
      desc.includes("cab") ||
      desc.includes("uber") ||
      desc.includes("taxi") ||
      desc.includes("toll")
    ) {
      return "Transport";
    } else if (desc.includes("movie") || desc.includes("entertainment")) {
      return "Entertainment";
    } else if (
      desc.includes("grocery") ||
      desc.includes("shopping") ||
      desc.includes("mall")
    ) {
      return "Shopping";
    } else if (desc.includes("hotel") || desc.includes("accommodation")) {
      return "Accommodation";
    } else {
      return "Other";
    }
  };

  // Get member name
  const getMemberName = (userId) => {
    const member = selectedGroup?.members?.find((m) => m.user_id === userId);
    return member?.name || userId?.split("@")[0] || "Unknown";
  };

  // Process data for charts
  const chartData = useMemo(() => {
    if (!expenses || expenses.length === 0) return null;

    // 1. Spending Over Time (Line Chart)
    const spendingOverTime = {};
    expenses.forEach((expense) => {
      const date = expense.createdAt?.toDate
        ? expense.createdAt.toDate()
        : new Date(expense.createdAt || expense.date);
      const dateKey = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      if (!spendingOverTime[dateKey]) {
        spendingOverTime[dateKey] = 0;
      }
      spendingOverTime[dateKey] += expense.amount || 0;
    });

    const spendingOverTimeData = Object.entries(spendingOverTime)
      .map(([date, amount]) => ({
        date,
        amount: parseFloat(amount.toFixed(2)),
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // 2. Category-wise Expenses (Pie Chart)
    const categoryData = {};
    expenses.forEach((expense) => {
      const category = getCategory(expense.description);
      if (!categoryData[category]) {
        categoryData[category] = 0;
      }
      categoryData[category] += expense.amount || 0;
    });

    const pieChartData = Object.entries(categoryData)
      .map(([name, value]) => ({
        name,
        value: parseFloat(value.toFixed(2)),
      }))
      .sort((a, b) => b.value - a.value);

    // 3. Member-wise Spending (Bar Chart)
    const memberSpending = {};
    expenses.forEach((expense) => {
      if (expense.paidBy) {
        if (!memberSpending[expense.paidBy]) {
          memberSpending[expense.paidBy] = 0;
        }
        memberSpending[expense.paidBy] += expense.amount || 0;
      }
    });

    const barChartData = Object.entries(memberSpending)
      .map(([userId, amount]) => ({
        name: getMemberName(userId),
        amount: parseFloat(amount.toFixed(2)),
      }))
      .sort((a, b) => b.amount - a.amount);

    // 4. Monthly Spending (Area Chart)
    const monthlySpending = {};
    expenses.forEach((expense) => {
      const date = expense.createdAt?.toDate
        ? expense.createdAt.toDate()
        : new Date(expense.createdAt || expense.date);
      const monthKey = date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
      if (!monthlySpending[monthKey]) {
        monthlySpending[monthKey] = 0;
      }
      monthlySpending[monthKey] += expense.amount || 0;
    });

    const monthlyData = Object.entries(monthlySpending)
      .map(([month, amount]) => ({
        month,
        amount: parseFloat(amount.toFixed(2)),
      }))
      .sort((a, b) => new Date(a.month) - new Date(b.month));

    return {
      spendingOverTimeData,
      pieChartData,
      barChartData,
      monthlyData,
    };
  }, [expenses, selectedGroup]);

  // Colors for charts
  const COLORS = [
    "#10b981", // green-500
    "#f59e0b", // orange-500
    "#3b82f6", // blue-500
    "#8b5cf6", // purple-500
    "#ec4899", // pink-500
    "#06b6d4", // cyan-500
    "#f97316", // orange-600
    "#6366f1", // indigo-500
  ];

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto h-full flex flex-col overflow-hidden px-4 sm:px-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6 flex-shrink-0 pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPage("groupDetail")}
            className="p-0 h-auto"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-lg sm:text-2xl font-semibold text-foreground flex-1 text-center">
            Charts
          </h2>
          <div className="w-5" />
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!chartData || expenses.length === 0) {
    return (
      <div className="max-w-6xl mx-auto h-full flex flex-col overflow-hidden px-4 sm:px-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6 flex-shrink-0 pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPage("groupDetail")}
            className="p-0 h-auto"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-lg sm:text-2xl font-semibold text-foreground flex-1 text-center">
            Charts
          </h2>
          <div className="w-5" />
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide flex items-center justify-center">
          <div className="text-center">
            <PieChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              No expenses to display charts
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col overflow-hidden px-4 sm:px-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6 flex-shrink-0 pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentPage("groupDetail")}
          className="p-0 h-auto"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-lg sm:text-2xl font-semibold text-foreground flex-1 text-center">
          Charts
        </h2>
        <div className="w-5" />
      </div>

      {/* Charts Content - Scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
        <div className="space-y-6 pb-4">
          {/* Spending Over Time - Line Chart */}
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-foreground" />
                <CardTitle className="text-base">Spending Over Time</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData.spendingOverTimeData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="date"
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: "12px" }}
                    tickFormatter={(value) => `₹${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                    }}
                    formatter={(value) => [`₹${value}`, "Amount"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="hsl(142 76% 36%)"
                    strokeWidth={2}
                    dot={{ fill: "hsl(142 76% 36%)", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Category-wise Expenses - Pie Chart */}
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <PieChart className="h-5 w-5 text-foreground" />
                <CardTitle className="text-base">
                  Expenses by Category
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="w-full">
                <ResponsiveContainer
                  width="100%"
                  height={windowWidth < 640 ? 320 : 350}
                  minHeight={280}
                >
                  <RechartsPieChart>
                    <Pie
                      data={chartData.pieChartData}
                      cx="50%"
                      cy={windowWidth < 640 ? "40%" : "45%"}
                      labelLine={false}
                      label={
                        windowWidth < 640
                          ? false
                          : ({ name, percent }) => {
                              const shortName =
                                name.length > 8
                                  ? name.substring(0, 6) + ".."
                                  : name;
                              return `${shortName} ${(percent * 100).toFixed(
                                0
                              )}%`;
                            }
                      }
                      outerRadius={windowWidth < 640 ? 65 : 85}
                      innerRadius={windowWidth < 640 ? 20 : 30}
                      fill="#8884d8"
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {chartData.pieChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                        fontSize: "12px",
                      }}
                      formatter={(value) => [`₹${value.toFixed(2)}`, "Amount"]}
                      labelFormatter={(name) => `Category: ${name}`}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={windowWidth < 640 ? 120 : 60}
                      iconType="circle"
                      wrapperStyle={{
                        fontSize: windowWidth < 640 ? "10px" : "11px",
                        paddingTop: "10px",
                      }}
                      formatter={(value) => {
                        const entry = chartData.pieChartData.find(
                          (d) => d.name === value
                        );
                        const percent = entry
                          ? (
                              (entry.value /
                                chartData.pieChartData.reduce(
                                  (sum, d) => sum + d.value,
                                  0
                                )) *
                              100
                            ).toFixed(0)
                          : "0";
                        if (windowWidth < 640) {
                          const shortName =
                            value.length > 12
                              ? value.substring(0, 10) + ".."
                              : value;
                          return `${shortName} (${percent}%)`;
                        }
                        return `${value} (${percent}%)`;
                      }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Member-wise Spending - Bar Chart */}
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-foreground" />
                <CardTitle className="text-base">Spending by Member</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.barChartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="name"
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: "12px" }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: "12px" }}
                    tickFormatter={(value) => `₹${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                    }}
                    formatter={(value) => [`₹${value}`, "Amount"]}
                  />
                  <Bar
                    dataKey="amount"
                    fill="hsl(142 76% 36%)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Monthly Spending - Area Chart */}
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-foreground" />
                <CardTitle className="text-base">
                  Monthly Spending Trend
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData.monthlyData}>
                  <defs>
                    <linearGradient
                      id="colorAmount"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="hsl(142 76% 36%)"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(142 76% 36%)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="month"
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: "12px" }}
                    tickFormatter={(value) => `₹${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                    }}
                    formatter={(value) => [`₹${value}`, "Amount"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="hsl(142 76% 36%)"
                    fillOpacity={1}
                    fill="url(#colorAmount)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ChartsPage;
