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
    value: filteredEntries.reduce((acc, [, d]) => {
      if (cat === "other") {
        return acc + (d.other
          ? Object.values(d.other).reduce((sum, v) => sum + (parseInt(v) || 0), 0)
          : 0);
      }
      return acc + (parseInt(d[cat]) || 0);
    }, 0),
  }));

  const totalSpent = categoryTotals.reduce((sum, c) => sum + c.value, 0);

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
    <div className="px-4 sm:px-6 lg:px-8 container mx-auto py-6">
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

      <div className="sticky top-0 z-20 bg-white shadow-md rounded-xl mb-6 flex flex-wrap justify-between items-center p-4 gap-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💰</span>
          <div>
            <div className="text-xs text-gray-500">Total Budget</div>
            <div className="text-lg font-bold text-blue-700">{summary?.totalBudget ?? '--'} Tk</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl">💸</span>
          <div>
            <div className="text-xs text-gray-500">Total Spent</div>
            <div className="text-lg font-bold text-red-600">{totalSpent ?? '--'} Tk</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl">🟢</span>
          <div>
            <div className="text-xs text-gray-500">Remaining</div>
            <div className={`text-lg font-bold ${summary && summary.totalBudget - totalSpent < 0 ? 'text-red-600' : 'text-green-700'}`}>{summary ? summary.totalBudget - totalSpent : '--'} Tk</div>
          </div>
        </div>
      </div>

      {monthlyComparisons.length > 1 && (
        <div className="mb-6 p-4 bg-gradient-to-r from-indigo-100 to-pink-100 rounded-xl shadow flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="font-semibold text-lg">📅 This Month vs Last Month</div>
          <div className="flex gap-8">
            <div>
              <div className="text-xs text-gray-500">This Month</div>
              <div className="font-bold text-blue-700">{monthlyComparisons[monthlyComparisons.length-1].spent} Tk</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Last Month</div>
              <div className="font-bold text-purple-700">{monthlyComparisons[monthlyComparisons.length-2].spent} Tk</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Change</div>
              <div className={`font-bold ${monthlyComparisons[monthlyComparisons.length-1].spent - monthlyComparisons[monthlyComparisons.length-2].spent >= 0 ? 'text-red-600' : 'text-green-600'}`}>{monthlyComparisons[monthlyComparisons.length-1].spent - monthlyComparisons[monthlyComparisons.length-2].spent} Tk</div>
            </div>
          </div>
        </div>
      )}

      {filteredEntries.length > 0 && (
        <div className="mb-6">
          <div className="font-semibold mb-2">🔥 Top 3 Spending Days</div>
          <div className="flex gap-4 flex-wrap">
            {filteredEntries
              .map(([date, data]) => ({
                date,
                total: [...fixedCategories, ...normalCategories].reduce((acc, c) => acc + (parseInt(data[c]) || 0), 0) + (data.other ? Object.values(data.other).reduce((sum, v) => sum + (parseInt(v) || 0), 0) : 0)
              }))
              .sort((a, b) => b.total - a.total)
              .slice(0, 3)
              .map(({ date, total }) => (
                <div key={date} className="p-3 bg-white rounded-xl shadow border flex flex-col items-center min-w-[120px]">
                  <div className="text-lg font-bold text-red-600">{total} Tk</div>
                  <div className="text-xs text-gray-500">{date}</div>
                </div>
              ))}
          </div>
        </div>
      )}

      {categoryTotals.length > 0 && (
        <div className="mb-6">
          <div className="font-semibold mb-2">🏆 Top 3 Categories</div>
          <div className="flex gap-4 flex-wrap">
            {categoryTotals
              .filter(c => c.name !== 'other')
              .sort((a, b) => b.value - a.value)
              .slice(0, 3)
              .map((c, i) => (
                <div key={c.name} className="p-3 bg-white rounded-xl shadow border flex flex-col items-center min-w-[120px]">
                  <div className="text-lg font-bold" style={{ color: COLORS[i % COLORS.length] }}>{c.value} Tk</div>
                  <div className="text-xs text-gray-500 capitalize">{c.name}</div>
                </div>
              ))}
          </div>
        </div>
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

      <div className="mb-6 flex justify-end">
        <button
          onClick={() => {
            let csv = 'Date,' + categories.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(',') + ',Total\n';
            filteredEntries.forEach(([date, data]) => {
              const row = categories.map(cat => {
                if (cat === 'other' && data.other && typeof data.other === 'object') {
                  return Object.entries(data.other).map(([k, v]) => `${k}:${v}`).join(' | ');
                }
                return data[cat] || 0;
              });
              const total = [...fixedCategories, ...normalCategories].reduce((acc, c) => acc + (parseInt(data[c]) || 0), 0) + (data.other ? Object.values(data.other).reduce((sum, v) => sum + (parseInt(v) || 0), 0) : 0);
              csv += `${date},${row.join(',')},${total}\n`;
            });
            const blob = new Blob([csv], { type: 'text/csv' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${month || 'expenses'}_breakdown.csv`;
            link.click();
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
        >
          ⬇️ Download CSV
        </button>
      </div>

      {filteredEntries.length > 0 && (
        <div className="mb-10 overflow-x-auto">
          <div className="font-semibold mb-2">📅 Daily Breakdown</div>
          <table className="min-w-full bg-white rounded-xl shadow overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">Date</th>
                {categories.map(cat => (
                  <th key={cat} className="p-2 text-left capitalize">{cat}</th>
                ))}
                <th className="p-2 text-left">Total</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map(([date, data]) => {
                const total = [...fixedCategories, ...normalCategories].reduce((acc, c) => acc + (parseInt(data[c]) || 0), 0) + (data.other ? Object.values(data.other).reduce((sum, v) => sum + (parseInt(v) || 0), 0) : 0);
                return (
                  <tr key={date} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-mono text-xs">{date}</td>
                    {categories.map(cat => (
                      <td key={cat} className="p-2">
                        {cat === 'other' && data.other && typeof data.other === 'object' ? (
                          <details>
                            <summary className="cursor-pointer text-blue-600">{Object.values(data.other).reduce((sum, v) => sum + (parseInt(v) || 0), 0)} Tk</summary>
                            <ul className="ml-4 text-xs">
                              {Object.entries(data.other).map(([label, value], idx) => (
                                <li key={idx}>{label}: {value} Tk</li>
                              ))}
                            </ul>
                          </details>
                        ) : (
                          data[cat] || 0
                        )}
                      </td>
                    ))}
                    <td className="p-2 font-bold">{total} Tk</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-8">
        <h4 className="font-semibold mb-2">🔁 Recurring Expenses</h4>
        {recurringExpenses.length === 0 ? (
          <p className="text-gray-500">No recurring expenses detected.</p>
        ) : (
          <div className="flex flex-wrap gap-4">
            {recurringExpenses.map((item, idx) => (
              <div key={idx} className="p-4 bg-white rounded-xl shadow border min-w-[200px]">
                <div className="font-bold text-blue-700">{item.label}</div>
                <div className="text-xs text-gray-500">{item.amount} Tk</div>
                <div className="text-xs text-gray-400 mt-1">on {item.dates.join(", ")}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
