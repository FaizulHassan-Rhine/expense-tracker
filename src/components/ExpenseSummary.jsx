// src/components/ExpenseSummary.jsx
import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import db from "../firebase";

export default function ExpenseSummary({ month }) {
  const [summary, setSummary] = useState(null);
  const [dailyExpenses, setDailyExpenses] = useState({});

  useEffect(() => {
    const summaryRef = ref(db, `months/${month}/summary`);
    const dailyRef = ref(db, `months/${month}/daily`);

    const unsubSummary = onValue(summaryRef, (snapshot) => {
      setSummary(snapshot.val());
    });

    const unsubDaily = onValue(dailyRef, (snapshot) => {
      setDailyExpenses(snapshot.val() || {});
    });

    return () => {
      unsubSummary();
      unsubDaily();
    };
  }, [month]);

  if (!summary) return <p className="text-center text-gray-500">Loading summary...</p>;

  const totalSpent = Object.values(dailyExpenses).reduce(
    (acc, day) => acc + (day.total || 0),
    0
  );

  return (
    <div className="mt-6 bg-white p-4 rounded shadow">
      <h3 className="text-lg font-semibold mb-2">Summary for {month}</h3>
      <p>Total Budget: <strong>{summary.totalBudget} Tk</strong></p>
      <p>Total Spent: <strong>{totalSpent} Tk</strong></p>
      <p>Remaining Budget: <strong>{summary.remaining} Tk</strong></p>

      <div className="mt-4">
        <h4 className="font-semibold mb-2">Daily Expenses</h4>
        <ul className="space-y-1 max-h-48 overflow-y-auto">
          {Object.entries(dailyExpenses).map(([day, data]) => (
            <li key={day} className="border-b border-gray-200 py-1">
              <strong>Day {day}:</strong> {data.total} Tk (Transport: {data.transport || 0}, Grocery: {data.grocery || 0}, Shopping: {data.shopping || 0}, Other: {data.other || 0})
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
