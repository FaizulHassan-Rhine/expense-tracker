import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import db from "../firebase";

export default function ExpenseSummary({ month }) {
  const [summary, setSummary] = useState(null);
  const [dailyExpenses, setDailyExpenses] = useState({});

  useEffect(() => {
    const summaryRef = ref(db, `months/${month}/summary`);
    const dailyRef = ref(db, `months/${month}/dailyExpenses`);

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

  const getDayTotal = (day) => {
    const fixed = ["transport", "houseRent", "grocery"].reduce(
      (sum, cat) => sum + (parseInt(day[cat]) || 0),
      0
    );
    const other = day.other
      ? Object.values(day.other).reduce((sum, v) => sum + (parseInt(v) || 0), 0)
      : 0;
    return fixed + other;
  };

  const totalSpent = Object.values(dailyExpenses).reduce(
    (acc, day) => acc + getDayTotal(day),
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
        <ul className="space-y-3 max-h-64 overflow-y-auto text-sm">
          {Object.entries(dailyExpenses).map(([day, data]) => (
            <li key={day} className="border border-gray-200 p-3 rounded">
              <p className="font-medium text-blue-600">Date: {day} — <span className="text-black">Total: {getDayTotal(data)} Tk</span></p>
              <ul className="ml-4 list-disc">
                <li>Transport: {data.transport || 0} Tk</li>
                <li>House Rent: {data.houseRent || 0} Tk</li>
                <li>Grocery: {data.grocery || 0} Tk</li>
                {data.other && typeof data.other === "object" && (
                  <li className="mt-1">Other:
                    <ul className="ml-4 list-disc text-gray-700">
                      {Object.entries(data.other).map(([label, value], idx) => (
                        <li key={idx}>{label}: {value} Tk</li>
                      ))}
                    </ul>
                  </li>
                )}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
