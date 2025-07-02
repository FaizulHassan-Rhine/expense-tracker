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

const fixedCategories = ["houseRent", "savings", "internet", "electricity"];
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
      <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-transparent bg-clip-text mb-6">
        📊 Expense Dashboard
      </h2>

      <div className="w-full max-w-xs mx-auto bg-white rounded-xl shadow-lg p-4 mt-4 mb-4">
        <label className="block mb-2 font-semibold text-blue-700 text-sm">Month</label>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="w-full mb-4 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          disabled={loading}
        />
        <label className="block mb-2 font-semibold text-blue-700 text-sm">Start Date</label>
        <DatePicker
          selected={weekRange.start}
          onChange={(date) => setWeekRange({ ...weekRange, start: date })}
          className="w-full mb-4 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          dateFormat="yyyy-MM-dd"
          placeholderText="Start date"
          withPortal
          popperClassName="custom-datepicker-popper"
        />
        <label className="block mb-2 font-semibold text-blue-700 text-sm">End Date</label>
        <DatePicker
          selected={weekRange.end}
          onChange={(date) => setWeekRange({ ...weekRange, end: date })}
          className="w-full mb-4 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          dateFormat="yyyy-MM-dd"
          placeholderText="End date"
          withPortal
          popperClassName="custom-datepicker-popper"
        />
      </div>

      {/* Modern, beautiful summary cards for mobile/desktop */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 items-center justify-center w-full my-4">
        <div className="flex-1 w-full bg-gradient-to-r from-green-100 to-green-200 rounded-2xl shadow-lg flex items-center justify-between px-4 py-3">
          <span className="text-2xl">💰</span>
          <span className="text-lg font-bold text-green-700">{summary?.totalBudget ?? '--'} Tk</span>
          <span className="text-xs text-gray-500">Total Budget</span>
        </div>
        <div className="flex-1 w-full bg-gradient-to-r from-red-100 to-red-200 rounded-2xl shadow-lg flex items-center justify-between px-4 py-3">
          <span className="text-2xl">💸</span>
          <span className="text-lg font-bold text-red-700">{totalSpent ?? '--'} Tk</span>
          <span className="text-xs text-gray-500">Total Spent</span>
        </div>
        <div className="flex-1 w-full bg-gradient-to-r from-yellow-100 to-green-100 rounded-2xl shadow-lg flex items-center justify-between px-4 py-3">
          <span className="text-2xl">��</span>
          <span className="text-lg font-bold text-green-700">{summary ? summary.totalBudget - totalSpent : '--'} Tk</span>
          <span className="text-xs text-gray-500">Remaining</span>
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

     <div className="flex flex-col sm:flex-row gap-4 flex-wrap mb-6 items-center">
     {filteredEntries.length > 0 && (
        <div className="mb-6">
          <div className="font-semibold mb-2">🔥 Top 3 Spending Days</div>
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
                <div key={date} className="p-3 bg-white rounded-xl shadow border flex flex-col items-center min-w-[120px]">
                  <div className="text-lg font-bold text-red-600">{total} Tk</div>
                  <div className="text-xs text-gray-500">{date}</div>
                </div>
              ))}
          </div>
        </div>
      )}

      {summary && (
        <div className="mb-6">
          <div className="font-semibold mb-2">📊 Category Budgets & Remaining</div>
          <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
            {categories.filter(c => c !== 'other').map((cat) => {
              // Get budget for this category from summary
              const budget = parseInt(summary[cat]) || 0;
              // Get spent for this category from filteredEntries
              const spent = filteredEntries.reduce((acc, [, d]) => {
                if (d[cat] && typeof d[cat] === 'object') {
                  return acc + Object.values(d[cat]).reduce((sum, v) => sum + (parseInt(v) || 0), 0);
                }
                return acc + (parseInt(d[cat]) || 0);
              }, 0);
              const remaining = budget - spent;
              return (
                <div key={cat} className="p-3 bg-white rounded-xl shadow border flex flex-col items-center min-w-[140px]">
                  <div className="text-xs text-gray-500 capitalize mb-1">{cat}</div>
                  <div className="text-sm">Budget: <span className="font-bold text-blue-700">{budget} Tk</span></div>
                  <div className="text-sm">Spent: <span className="font-bold text-red-600">{spent} Tk</span></div>
                  <div className="text-sm">Remaining: <span className={`font-bold ${remaining < 0 ? 'text-red-600' : 'text-green-700'}`}>{remaining} Tk</span></div>
                </div>
              );
            })}
          </div>
        </div>
      )}
     </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
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
          className="py-2 px-4 rounded-xl text-white font-bold shadow-md transition bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
        >
          ⬇️ Download CSV
        </button>
      </div>

      {filteredEntries.length > 0 && (
        <div className="mb-10 overflow-x-auto">
          <div className="font-semibold mb-2">📅 Daily Breakdown</div>
          <table className="min-w-full bg-white rounded-xl shadow overflow-x-auto text-xs sm:text-sm">
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
                const total = categories.reduce((acc, cat) => {
                  if (data[cat] && typeof data[cat] === 'object') {
                    return acc + Object.values(data[cat]).reduce((sum, v) => sum + (parseInt(v) || 0), 0);
                  }
                  return acc + (parseInt(data[cat]) || 0);
                }, 0);
                return (
                  <tr key={date} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-mono text-xs">{date}</td>
                    {categories.map(cat => (
                      <td key={cat} className="p-2">
                        {(cat === 'other' || cat === 'grocery' || cat === 'transport') && data[cat] && typeof data[cat] === 'object' ? (
                          <details>
                            <summary className="cursor-pointer text-blue-600">
                              {Object.values(data[cat]).reduce((sum, v) => sum + (parseInt(v) || 0), 0)} Tk
                            </summary>
                            <ul className="ml-4 text-xs">
                              {Object.entries(data[cat]).map(([label, value], idx) => (
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
          <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
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
