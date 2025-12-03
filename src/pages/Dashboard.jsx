import React, { useState, useEffect } from "react";
import { ref, get } from "firebase/database";
import db from "../firebase";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { DatePicker } from "../components/ui/date-picker";
import { MonthPicker } from "../components/ui/month-picker";
import { TrendingUp, TrendingDown, Wallet, Download, Calendar, BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon, DollarSign, ArrowUpRight, ArrowDownRight, Coins, Receipt } from "lucide-react";

const fixedCategories = ["houseRent", "savings", "internet", "electricity"];
const normalCategories = ["transport", "grocery"];
const categories = [...fixedCategories, ...normalCategories, "other"];
const COLORS = [
  "#6366F1", // Indigo
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Violet
  "#06B6D4", // Cyan
  "#F97316", // Orange
  "#84CC16", // Lime
  "#EC4899", // Pink
  "#14B8A6", // Teal
];

const Dashboard = () => {
  const [month, setMonth] = useState("");
  const [summary, setSummary] = useState(null);
  const [dailyExpenses, setDailyExpenses] = useState({});
  const [monthlyComparisons, setMonthlyComparisons] = useState([]);
  const [weekRange, setWeekRange] = useState({ start: null, end: null });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!month) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const summarySnap = await get(ref(db, `months/${month}/summary`));
        setSummary(summarySnap.exists() ? summarySnap.val() : null);

        const dailySnap = await get(ref(db, `months/${month}/dailyExpenses`));
        setDailyExpenses(dailySnap.exists() ? dailySnap.val() : {});
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [month]);

  useEffect(() => {
    const fetchAllSummaries = async () => {
      const monthsRef = ref(db, "months");
      const snap = await get(monthsRef);
      if (snap.exists()) {
        const data = snap.val();
        const chartData = Object.entries(data).map(([key, val]) => {
          const s = val.summary || {};
          return {
            month: key,
            budget: s.totalBudget || 0,
            spent: (s.totalBudget || 0) - (s.remaining || 0),
          };
        });
        setMonthlyComparisons(chartData);
      }
    };
    fetchAllSummaries();
  }, []);

  // Helper to check if a date is within the selected range
  function isInRange(dateStr, start, end) {
    if (!start && !end) return true;
    const d = new Date(dateStr);
    if (start && d < new Date(start)) return false;
    if (end && d > new Date(end)) return false;
    return true;
  }

  // Filter dailyExpenses for the selected range
  const filteredEntries = Object.entries(dailyExpenses).filter(([date]) => isInRange(date, weekRange.start, weekRange.end));

  // Use filteredEntries for all calculations below:
  const dailyData = filteredEntries.map(([date, data]) => {
    const total = categories.reduce((acc, cat) => {
      if (data[cat] && typeof data[cat] === 'object') {
        return acc + Object.values(data[cat]).reduce((sum, v) => sum + (parseInt(v) || 0), 0);
      }
      return acc + (parseInt(data[cat]) || 0);
    }, 0);
    return {
      date: date.slice(8),
      total,
    };
  });

  const categoryTotals = categories.map((cat) => ({
    name: cat,
    value: filteredEntries.reduce((acc, [, d]) => {
      if (d[cat] && typeof d[cat] === 'object') {
        return acc + Object.values(d[cat]).reduce((sum, v) => sum + (parseInt(v) || 0), 0);
      }
      return acc + (parseInt(d[cat]) || 0);
    }, 0),
  }));

  const totalSpent = filteredEntries.reduce((sum, [, d]) => {
    return sum + categories.reduce((catSum, cat) => {
      if (d[cat] && typeof d[cat] === 'object') {
        return catSum + Object.values(d[cat]).reduce((s, v) => s + (parseInt(v) || 0), 0);
      }
      return catSum + (parseInt(d[cat]) || 0);
    }, 0);
  }, 0);

  // For recurring expenses, use filteredEntries as well
  const recurringMap = {};
  filteredEntries.forEach(([date, data]) => {
    categories.forEach((cat) => {
      if (cat === "other" && typeof data.other === "object") {
        Object.entries(data.other).forEach(([label, amount]) => {
          const key = `other-${label}-${amount}`;
          recurringMap[key] = recurringMap[key] || [];
          recurringMap[key].push(date);
        });
      } else {
        const val = parseInt(data[cat]);
        if (val > 0) {
          const key = `${cat}-${val}`;
          recurringMap[key] = recurringMap[key] || [];
          recurringMap[key].push(date);
        }
      }
    });
  });

  const recurringExpenses = Object.entries(recurringMap)
    .filter(([, dates]) => dates.length > 1)
    .map(([key, dates]) => {
      const parts = key.split("-");
      const category = parts[0];
      const label = parts[1] || "";
      const amount = parts[2] || parts[1];
      return {
        label: category === "other" ? `Other - ${label}` : category,
        amount,
        dates,
      };
    });

  return (
    <div className="px-2 sm:px-4 lg:px-8 container mx-auto py-4 sm:py-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="h-8 w-8 text-primary" />
        <h2 className="text-3xl font-bold">Expense Dashboard</h2>
      </div>

      <Card className="w-full max-w-lg mx-auto mb-8 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Calendar className="h-5 w-5 text-primary" />
            Filter Options
          </CardTitle>
          <CardDescription>
            Select a month and date range to view your expenses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="month" className="text-sm font-medium">Month</Label>
            <MonthPicker
              value={month}
              onChange={setMonth}
              placeholder="Select month"
              disabled={loading}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Start Date</Label>
              <DatePicker
                date={weekRange.start}
                onSelect={(date) => setWeekRange({ ...weekRange, start: date })}
                placeholder="Start date"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">End Date</Label>
              <DatePicker
                date={weekRange.end}
                onSelect={(date) => setWeekRange({ ...weekRange, end: date })}
                placeholder="End date"
                disabled={loading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="relative overflow-hidden border-l-4 border-l-primary shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Budget</CardTitle>
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
              <Coins className="h-6 w-6 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold mb-1">{summary?.totalBudget?.toLocaleString() ?? '--'} Tk</div>
            <p className="text-xs text-muted-foreground">Allocated for this month</p>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden border-l-4 border-l-destructive shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/5 rounded-full -mr-16 -mt-16"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center border-2 border-destructive/20">
              <Receipt className="h-6 w-6 text-destructive" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-destructive mb-1">{totalSpent?.toLocaleString() ?? '--'} Tk</div>
            <p className="text-xs text-muted-foreground">Expenses incurred</p>
          </CardContent>
        </Card>
        <Card className={`relative overflow-hidden border-l-4 shadow-lg hover:shadow-xl transition-all duration-300 ${summary && (summary.totalBudget - totalSpent) < 0 ? 'border-l-destructive' : 'border-l-primary'}`}>
          <div className={`absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 ${summary && (summary.totalBudget - totalSpent) < 0 ? 'bg-destructive/5' : 'bg-primary/5'}`}></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground">Remaining</CardTitle>
            <div className={`h-12 w-12 rounded-full flex items-center justify-center border-2 ${summary && (summary.totalBudget - totalSpent) < 0 ? 'bg-destructive/10 border-destructive/20' : 'bg-primary/10 border-primary/20'}`}>
              {summary && (summary.totalBudget - totalSpent) < 0 ? (
                <TrendingDown className="h-6 w-6 text-destructive" />
              ) : (
                <TrendingUp className="h-6 w-6 text-primary" />
              )}
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className={`text-3xl font-bold mb-1 ${summary && (summary.totalBudget - totalSpent) < 0 ? 'text-destructive' : 'text-primary'}`}>
              {summary ? (summary.totalBudget - totalSpent).toLocaleString() : '--'} Tk
            </div>
            <p className="text-xs text-muted-foreground">
              {summary && (summary.totalBudget - totalSpent) < 0 ? 'Over budget' : 'Available balance'}
            </p>
          </CardContent>
        </Card>
          <span className="text-2xl">��</span>
      </div>

      {monthlyComparisons.length > 1 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>This Month vs Last Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-6 items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">{monthlyComparisons[monthlyComparisons.length-1].spent.toLocaleString()} Tk</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Last Month</p>
                <p className="text-2xl font-bold">{monthlyComparisons[monthlyComparisons.length-2].spent.toLocaleString()} Tk</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Change</p>
                <p className={`text-2xl font-bold ${monthlyComparisons[monthlyComparisons.length-1].spent - monthlyComparisons[monthlyComparisons.length-2].spent >= 0 ? 'text-destructive' : 'text-primary'}`}>
                  {monthlyComparisons[monthlyComparisons.length-1].spent - monthlyComparisons[monthlyComparisons.length-2].spent >= 0 ? '+' : ''}
                  {(monthlyComparisons[monthlyComparisons.length-1].spent - monthlyComparisons[monthlyComparisons.length-2].spent).toLocaleString()} Tk
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {filteredEntries.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Top 3 Spending Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 flex-wrap">
              {filteredEntries
                .map(([date, data]) => ({
                  date,
                  total: categories.reduce((acc, cat) => {
                    if (data[cat] && typeof data[cat] === 'object') {
                      return acc + Object.values(data[cat]).reduce((sum, v) => sum + (parseInt(v) || 0), 0);
                    }
                    return acc + (parseInt(data[cat]) || 0);
                  }, 0)
                }))
                .sort((a, b) => b.total - a.total)
                .slice(0, 3)
                .map(({ date, total }) => (
                  <Card key={date} className="min-w-[120px]">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-lg font-bold text-destructive">{total.toLocaleString()} Tk</div>
                        <div className="text-xs text-muted-foreground">{date}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {summary && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Category Budgets & Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories.filter(c => c !== 'other').map((cat) => {
                const budget = parseInt(summary[cat]) || 0;
                const spent = filteredEntries.reduce((acc, [, d]) => {
                  if (d[cat] && typeof d[cat] === 'object') {
                    return acc + Object.values(d[cat]).reduce((sum, v) => sum + (parseInt(v) || 0), 0);
                  }
                  return acc + (parseInt(d[cat]) || 0);
                }, 0);
                const remaining = budget - spent;
                return (
                  <Card key={cat}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm capitalize">{cat.replace(/([A-Z])/g, " $1").trim()}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      <div className="text-xs text-muted-foreground">Budget</div>
                      <div className="text-sm font-semibold">{budget.toLocaleString()} Tk</div>
                      <div className="text-xs text-muted-foreground">Spent</div>
                      <div className="text-sm font-semibold text-destructive">{spent.toLocaleString()} Tk</div>
                      <div className="text-xs text-muted-foreground">Remaining</div>
                      <div className={`text-sm font-semibold ${remaining < 0 ? 'text-destructive' : 'text-primary'}`}>
                        {remaining.toLocaleString()} Tk
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Daily Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="hsl(var(--primary))" animationDuration={1000} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Category Breakdown
            </CardTitle>
            <CardDescription>
              Distribution of expenses by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(() => {
              const filteredCategories = categoryTotals.filter(item => item.value > 0);
              const chartTotal = filteredCategories.reduce((sum, item) => sum + item.value, 0);
              
              if (filteredCategories.length === 0) {
                return (
                  <div className="flex items-center justify-center h-[280px] text-muted-foreground">
                    <div className="text-center">
                      <PieChartIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No expense data available</p>
                    </div>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={filteredCategories}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="hsl(var(--background))"
                        strokeWidth={2}
                        animationDuration={800}
                      >
                        {filteredCategories.map((entry, index) => (
                          <Cell 
                            key={`cell-${entry.name}`} 
                            fill={COLORS[index % COLORS.length]} 
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "6px",
                          padding: "8px 12px",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                        formatter={(value, name) => {
                          const displayName = name.charAt(0).toUpperCase() + 
                            name.slice(1).replace(/([A-Z])/g, " $1");
                          const percentage = chartTotal > 0 
                            ? ((value / chartTotal) * 100).toFixed(1) 
                            : 0;
                          return [
                            `${value.toLocaleString()} Tk (${percentage}%)`,
                            displayName
                          ];
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-border">
                    {filteredCategories.map((entry, index) => {
                      const percentage = chartTotal > 0 
                        ? ((entry.value / chartTotal) * 100).toFixed(1) 
                        : 0;
                      const displayName = entry.name.charAt(0).toUpperCase() + 
                        entry.name.slice(1).replace(/([A-Z])/g, " $1");
                      return (
                        <div 
                          key={entry.name} 
                          className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
                        >
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{displayName}</div>
                            <div className="text-xs text-muted-foreground">
                              {entry.value.toLocaleString()} Tk
                            </div>
                            <div className="text-xs font-semibold text-primary">
                              {percentage}%
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChartIcon className="h-5 w-5" />
              Spending Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 flex justify-end">
        <Button
          onClick={() => {
            let csv = 'Date,' + categories.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(',') + ',Total\n';
            filteredEntries.forEach(([date, data]) => {
              const row = categories.map(cat => {
                if (cat === 'other' && data.other && typeof data.other === 'object') {
                  return Object.entries(data.other).map(([k, v]) => `${k}:${v}`).join(' | ');
                }
                return data[cat] || 0;
              });
              const total = categories.reduce((acc, cat) => {
                if (data[cat] && typeof data[cat] === 'object') {
                  return acc + Object.values(data[cat]).reduce((sum, v) => sum + (parseInt(v) || 0), 0);
                }
                return acc + (parseInt(data[cat]) || 0);
              }, 0);
              csv += `${date},${row.join(',')},${total}\n`;
            });
            const blob = new Blob([csv], { type: 'text/csv' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${month || 'expenses'}_breakdown.csv`;
            link.click();
          }}
          variant="outline"
        >
          <Download className="h-4 w-4 mr-2" />
          Download CSV
        </Button>
      </div>

      {filteredEntries.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Daily Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs sm:text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-2 text-left font-semibold">Date</th>
                    {categories.map(cat => (
                      <th key={cat} className="p-2 text-left font-semibold capitalize">{cat.replace(/([A-Z])/g, " $1").trim()}</th>
                    ))}
                    <th className="p-2 text-left font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map(([date, data]) => {
                    const total = categories.reduce((acc, cat) => {
                      if (data[cat] && typeof data[cat] === 'object') {
                        return acc + Object.values(data[cat]).reduce((sum, v) => sum + (parseInt(v) || 0), 0);
                      }
                      return acc + (parseInt(data[cat]) || 0);
                    }, 0);
                    return (
                      <tr key={date} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-mono text-xs">{date}</td>
                        {categories.map(cat => (
                          <td key={cat} className="p-2">
                            {(cat === 'other' || cat === 'grocery' || cat === 'transport') && data[cat] && typeof data[cat] === 'object' ? (
                              <details>
                                <summary className="cursor-pointer text-primary hover:underline">
                                  {Object.values(data[cat]).reduce((sum, v) => sum + (parseInt(v) || 0), 0).toLocaleString()} Tk
                                </summary>
                                <ul className="ml-4 text-xs mt-1 space-y-1">
                                  {Object.entries(data[cat]).map(([label, value], idx) => (
                                    <li key={idx}>{label}: {value.toLocaleString()} Tk</li>
                                  ))}
                                </ul>
                              </details>
                            ) : (
                              data[cat] ? parseInt(data[cat]).toLocaleString() : 0
                            )}
                          </td>
                        ))}
                        <td className="p-2 font-bold">{total.toLocaleString()} Tk</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recurring Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {recurringExpenses.length === 0 ? (
            <p className="text-muted-foreground">No recurring expenses detected.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {recurringExpenses.map((item, idx) => (
                <Card key={idx}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{item.label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold text-primary">{item.amount.toLocaleString()} Tk</div>
                    <div className="text-xs text-muted-foreground mt-1">on {item.dates.join(", ")}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
