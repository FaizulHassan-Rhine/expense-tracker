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

const categories = ["transport", "houseRent", "grocery", "other"];
const COLORS = ["#6366F1", "#10B981", "#F59E0B", "#EF4444"];

const Dashboard = () => {
  const [month, setMonth] = useState("");
  const [summary, setSummary] = useState(null);
  const [dailyExpenses, setDailyExpenses] = useState({});
  const [monthlyComparisons, setMonthlyComparisons] = useState([]);
  const [weekRange, setWeekRange] = useState({ start: "", end: "" });
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

  const filteredDailyExpenses = Object.entries(dailyExpenses).filter(([date]) => {
    const d = new Date(date);
    const start = weekRange.start ? new Date(weekRange.start) : null;
    const end = weekRange.end ? new Date(weekRange.end) : null;
    return (!start || d >= start) && (!end || d <= end);
  });

  const dailyData = filteredDailyExpenses.map(([date, data]) => {
    const totalFixed = ["transport", "houseRent", "grocery"].reduce(
      (acc, c) => acc + (parseInt(data[c]) || 0),
      0
    );
    const totalOther = data.other
      ? Object.values(data.other).reduce((sum, v) => sum + (parseInt(v) || 0), 0)
      : 0;
    return {
      date: date.slice(8),
      total: totalFixed + totalOther,
    };
  });

  const categoryTotals = categories.map((cat) => ({
    name: cat,
    value: Object.values(dailyExpenses).reduce((acc, d) => {
      if (cat === "other") {
        return acc + (d.other
          ? Object.values(d.other).reduce((sum, v) => sum + (parseInt(v) || 0), 0)
          : 0);
      }
      return acc + (parseInt(d[cat]) || 0);
    }, 0),
  }));

  const totalSpent = Object.values(dailyExpenses).reduce((acc, d) => {
    const fixed = ["transport", "houseRent", "grocery"].reduce(
      (s, c) => s + (parseInt(d[c]) || 0),
      0
    );
    const other = d.other
      ? Object.values(d.other).reduce((s, v) => s + (parseInt(v) || 0), 0)
      : 0;
    return acc + fixed + other;
  }, 0);

  const recurringMap = {};
  Object.entries(dailyExpenses).forEach(([date, data]) => {
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
    .filter(([_, dates]) => dates.length > 1)
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
    <div className="px-4 sm:px-6 lg:px-8 container mx-auto py-6">
      <h2 className="text-2xl sm:text-3xl font-bold text-blue-800 mb-6">Expense Dashboard</h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6 ">
        <div>
          <label className="text-sm font-medium">Month</label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="block border rounded p-2"
            disabled={loading}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Start Date</label>
          <input
            type="date"
            value={weekRange.start}
            onChange={(e) => setWeekRange({ ...weekRange, start: e.target.value })}
            className="block border rounded p-2"
          />
        </div>
        <div>
          <label className="text-sm font-medium">End Date</label>
          <input
            type="date"
            value={weekRange.end}
            onChange={(e) => setWeekRange({ ...weekRange, end: e.target.value })}
            className="block border rounded p-2"
          />
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center mb-8">
          <div className="bg-blue-100 p-4 rounded shadow">
            <p className="font-semibold text-blue-700">Budget</p>
            <p className="text-xl font-bold">{summary.totalBudget} Tk</p>
          </div>
          <div className="bg-red-100 p-4 rounded shadow">
            <p className="font-semibold text-red-700">Spent</p>
            <p className="text-xl font-bold">{totalSpent} Tk</p>
          </div>
          <div className="bg-green-100 p-4 rounded shadow">
            <p className="font-semibold text-green-700">Remaining</p>
            <p
              className={`text-xl font-bold ${
                summary.totalBudget - totalSpent < 0
                  ? "text-red-600 animate-pulse"
                  : "text-green-700"
              }`}
            >
              {summary.totalBudget - totalSpent} Tk
            </p>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="p-4 border rounded shadow bg-gray-50">
          <h4 className="text-lg font-semibold mb-2">📊 Daily Total (Bar)</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" fill="#6366F1" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="p-4 border rounded shadow bg-gray-50">
          <h4 className="text-lg font-semibold mb-2">🍕 Category Breakdown (Pie)</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryTotals}
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                dataKey="value"
              >
                {categoryTotals.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="p-4 border rounded shadow bg-gray-50 col-span-1 lg:col-span-2">
          <h4 className="text-lg font-semibold mb-2">📈 Spending Trend (Line)</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#10B981" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Comparison */}
      <div className="mt-10 bg-white rounded p-4 shadow">
        <h4 className="text-lg font-semibold mb-2">📅 Monthly Comparison</h4>
        {monthlyComparisons.length === 0 ? (
          <p>No monthly data found.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyComparisons}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="budget" fill="#60A5FA" name="Budget" />
              <Bar dataKey="spent" fill="#F87171" name="Spent" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Recurring */}
      <div className="mt-10">
        <h4 className="text-lg font-semibold mb-2">🔁 Recurring Expenses</h4>
        {recurringExpenses.length === 0 ? (
          <p>No recurring expenses detected.</p>
        ) : (
          <ul className="list-disc pl-5 space-y-1 text-sm">
            {recurringExpenses.map((item, idx) => (
              <li key={idx}>
                <span className="font-medium">{item.label}</span> — {item.amount} Tk on{" "}
                {item.dates.join(", ")}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
