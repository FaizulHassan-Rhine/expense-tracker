import React, { useState, useEffect } from "react";
import { ref, get, set, update } from "firebase/database";
import db from "../firebase";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const categories = ["transport", "houseRent", "grocery", "other"];

const DailyExpenseInput = () => {
  const [month, setMonth] = useState("");
  const [date, setDate] = useState("");
  const [dailyExpenses, setDailyExpenses] = useState(
    categories.reduce((acc, c) => ({ ...acc, [c]: "" }), {})
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!month || !date) return;
    const fetchDailyExpenses = async () => {
      try {
        const snapshot = await get(
          ref(db, `months/${month}/dailyExpenses/${date}`)
        );
        if (snapshot.exists()) {
          setDailyExpenses(snapshot.val());
        } else {
          setDailyExpenses(categories.reduce((acc, c) => ({ ...acc, [c]: "" }), {}));
        }
      } catch (error) {
        toast.error("Failed to load daily expenses: " + error.message);
      }
    };
    fetchDailyExpenses();
  }, [month, date]);

  const handleChange = (e) => {
    setDailyExpenses({
      ...dailyExpenses,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!month || !date) {
      toast.error("Please select both month and date");
      return;
    }
    setLoading(true);
    try {
      // Save daily expenses
      await set(ref(db, `months/${month}/dailyExpenses/${date}`), dailyExpenses);

      // Calculate total spent today
      const totalSpentToday = categories.reduce(
        (acc, c) => acc + (parseInt(dailyExpenses[c]) || 0),
        0
      );

      // Fetch current remaining from monthly summary
      const summaryRef = ref(db, `months/${month}/summary`);
      const summarySnap = await get(summaryRef);

      if (!summarySnap.exists()) {
        toast.error("Monthly budget not found. Please set it first.");
        setLoading(false);
        return;
      }

      const summary = summarySnap.val();

      // Calculate total spent in month so far (sum all daily expenses except today)
      const dailyExpensesRef = ref(db, `months/${month}/dailyExpenses`);
      const allDailySnap = await get(dailyExpensesRef);
      let totalSpentInMonth = 0;
      if (allDailySnap.exists()) {
        const allDaysData = allDailySnap.val();
        for (const dayKey in allDaysData) {
          if (dayKey !== date) {
            const dayData = allDaysData[dayKey];
            totalSpentInMonth += categories.reduce(
              (acc, c) => acc + (parseInt(dayData[c]) || 0),
              0
            );
          }
        }
      }
      const newRemaining = summary.totalBudget - (totalSpentInMonth + totalSpentToday);

      // Update remaining in monthly summary
      await update(summaryRef, { remaining: newRemaining });

      toast.success("Daily expenses saved!");
    } catch (error) {
      toast.error("Error saving daily expenses: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-white shadow rounded mt-8">
      <ToastContainer position="top-right" autoClose={3000} />
      <h2 className="text-xl font-bold mb-4">Add Daily Expenses</h2>

      <label className="block mb-2">
        Select Month:
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="block w-full border rounded p-2 mt-1"
          disabled={loading}
        />
      </label>

      <label className="block mb-2">
        Select Date:
        <input
          type="date"
          value={date}
          min={month ? `${month}-01` : ""}
          max={month ? `${month}-31` : ""}
          onChange={(e) => setDate(e.target.value)}
          className="block w-full border rounded p-2 mt-1"
          disabled={loading || !month}
        />
      </label>

      {month && date && (
        <form onSubmit={handleSubmit}>
          {categories.map((cat) => (
            <label key={cat} className="block mb-3">
              {cat.charAt(0).toUpperCase() + cat.slice(1)}:
              <input
                type="number"
                min="0"
                name={cat}
                value={dailyExpenses[cat]}
                onChange={handleChange}
                className="block w-full border rounded p-2 mt-1"
                disabled={loading}
              />
            </label>
          ))}

          <button
            type="submit"
            disabled={loading}
            className={`w-full p-2 rounded text-white ${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {loading ? (
              <div className="flex justify-center items-center">
                <svg
                  className="animate-spin h-5 w-5 mr-2 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  ></path>
                </svg>
                Saving...
              </div>
            ) : (
              "Save Daily Expenses"
            )}
          </button>
        </form>
      )}
    </div>
  );
};

export default DailyExpenseInput;
