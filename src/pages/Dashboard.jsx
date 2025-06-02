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
} from "recharts";

const categories = ["transport", "houseRent", "grocery", "other"];
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const Dashboard = () => {
  const [month, setMonth] = useState("");
  const [summary, setSummary] = useState(null);
  const [dailyExpenses, setDailyExpenses] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!month) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Get summary
        const summarySnap = await get(ref(db, `months/${month}/summary`));
        if (summarySnap.exists()) {
          setSummary(summarySnap.val());
        } else {
          setSummary(null);
        }

        // Get daily expenses
        const dailySnap = await get(ref(db, `months/${month}/dailyExpenses`));
        if (dailySnap.exists()) {
          setDailyExpenses(dailySnap.val());
        } else {
          setDailyExpenses({});
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [month]);

  // Calculate total spent from dailyExpenses
  const totalSpent = Object.values(dailyExpenses).reduce((acc, dayData) => {
    return (
      acc +
      categories.reduce((subAcc, c) => subAcc + (parseInt(dayData[c]) || 0), 0)
    );
  }, 0);

  // Prepare data for charts

  // 1. Daily spending bar chart
  const dailyData = Object.entries(dailyExpenses).map(([date, data]) => ({
    date: date.slice(8), // Extract day (e.g., '2025-06-01' -> '01')
    total: categories.reduce((acc, c) => acc + (parseInt(data[c]) || 0), 0),
  }));

  // 2. Category spending pie chart for whole month
  const categoryTotals = categories.map((cat) => ({
    name: cat,
    value: Object.values(dailyExpenses).reduce(
      (acc, d) => acc + (parseInt(d[cat]) || 0),
      0
    ),
  }));

  return (
    <div className="max-w-4xl mx-auto p-4 bg-white shadow rounded mt-8">
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>

      <label className="block mb-4 max-w-xs">
        Select Month:
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="block w-full border rounded p-2 mt-1"
          disabled={loading}
        />
      </label>

      {loading && <p>Loading data...</p>}

      {!loading && month && (
        <>
          {!summary ? (
            <p className="text-red-600">No budget set for this month.</p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-4 mb-8 text-center">
                <div className="p-4 border rounded bg-blue-50">
                  <p className="text-lg font-semibold">Budget</p>
                  <p className="text-2xl">{summary.totalBudget} Tk</p>
                </div>
                <div className="p-4 border rounded bg-red-50">
                  <p className="text-lg font-semibold">Spent</p>
                  <p className="text-2xl">{totalSpent} Tk</p>
                </div>
                <div className="p-4 border rounded bg-green-50">
                  <p className="text-lg font-semibold">Remaining</p>
                  <p className="text-2xl">{summary.totalBudget - totalSpent} Tk</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Daily Spending Bar Chart */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">Daily Spending</h3>
                  {dailyData.length === 0 ? (
                    <p>No daily expenses recorded.</p>
                  ) : (
                    <BarChart width={450} height={300} data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="total" fill="#8884d8" />
                    </BarChart>
                  )}
                </div>

                {/* Category Spending Pie Chart */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Category Spending
                  </h3>
                  {categoryTotals.every((c) => c.value === 0) ? (
                    <p>No category expenses recorded.</p>
                  ) : (
                    <PieChart width={400} height={300}>
                      <Pie
                        data={categoryTotals}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryTotals.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
