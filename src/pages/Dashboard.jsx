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
import { motion } from "framer-motion";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const fixedCategories = ["houseRent", "internet"];
const normalCategories = ["transport", "grocery"];
const categories = [...fixedCategories, ...normalCategories, "other"];
const COLORS = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

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

 const normalize = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const filteredDailyExpenses = Object.entries(dailyExpenses).filter(([date]) => {
  const d = normalize(new Date(date));
  const start = weekRange.start ? normalize(new Date(weekRange.start)) : null;
  const end = weekRange.end ? normalize(new Date(weekRange.end)) : null;
  return (!start || d >= start) && (!end || d <= end);
});


  const dailyData = filteredDailyExpenses.map(([date, data]) => {
    const totalFixed = [...fixedCategories, ...normalCategories].reduce(
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

  const categoryBudgets = categories.map((cat) => {
    const budgeted = summary?.[cat] ? parseInt(summary[cat]) : 0;
    const spent = categoryTotals.find((c) => c.name === cat)?.value || 0;
    return {
      name: cat,
      budget: budgeted,
      spent,
      remaining: budgeted - spent,
    };
  });

  const totalSpent = categoryTotals.reduce((sum, c) => sum + c.value, 0);

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
    <motion.div
      className="px-4 sm:px-6 lg:px-8 container mx-auto py-6"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-transparent bg-clip-text mb-6">
        📊 Expense Dashboard
      </h2>

      <div className="flex flex-wrap gap-4 mb-6 items-end">
        <div>
          <label className="text-sm font-medium">Month</label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="block border rounded p-2 shadow-md"
            disabled={loading}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Start Date</label>
          <DatePicker
            selected={weekRange.start}
            onChange={(date) => setWeekRange({ ...weekRange, start: date })}
            className="block border rounded p-2 shadow-md"
            dateFormat="yyyy-MM-dd"
            placeholderText="Start date"
          />
        </div>
        <div>
          <label className="text-sm font-medium">End Date</label>
          <DatePicker
            selected={weekRange.end}
            onChange={(date) => setWeekRange({ ...weekRange, end: date })}
            className="block border rounded p-2 shadow-md"
            dateFormat="yyyy-MM-dd"
            placeholderText="End date"
          />
        </div>
      </div>

      {summary && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 text-center">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 shadow-xl">
              <p className="font-semibold text-blue-700">Budget</p>
              <p className="text-xl font-bold">{summary.totalBudget} Tk</p>
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-red-100 to-red-200 shadow-xl">
              <p className="font-semibold text-red-700">Spent</p>
              <p className="text-xl font-bold">{totalSpent} Tk</p>
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-green-100 to-green-200 shadow-xl">
              <p className="font-semibold text-green-700">Remaining</p>
              <p className={`text-xl font-bold ${summary.totalBudget - totalSpent < 0 ? "text-red-600" : "text-green-700"}`}>
                {summary.totalBudget - totalSpent} Tk
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {categoryBudgets.map((c, i) => (
              <div key={i} className="p-4 rounded-2xl bg-white shadow-md border">
                <p className="font-semibold capitalize">{c.name}</p>
                <p>Budget: <strong>{c.budget} Tk</strong></p>
                <p>Spent: <strong>{c.spent} Tk</strong></p>
                <p>Remaining: <strong className={c.remaining < 0 ? "text-red-600" : "text-green-600"}>{c.remaining} Tk</strong></p>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        <div className="p-4 bg-white rounded-xl shadow">
          <h4 className="font-semibold mb-2">📊 Daily Expenses (Bar)</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#6366F1" animationDuration={1000} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="p-4 bg-white rounded-xl shadow">
          <h4 className="font-semibold mb-2">🍕 Category Breakdown (Pie)</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryTotals}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value} Tk`}
              >
                {categoryTotals.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="col-span-full p-4 bg-white rounded-xl shadow">
          <h4 className="font-semibold mb-2">📈 Spending Trend (Line)</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#10B981" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-8">
        <h4 className="font-semibold mb-2">🔁 Recurring Expenses</h4>
        {recurringExpenses.length === 0 ? (
          <p className="text-gray-500">No recurring expenses detected.</p>
        ) : (
          <ul className="list-disc pl-5 space-y-1 text-sm">
            {recurringExpenses.map((item, idx) => (
              <li key={idx}>
                <span className="font-medium">{item.label}</span> — {item.amount} Tk on {item.dates.join(", ")}
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  );
};

export default Dashboard;
