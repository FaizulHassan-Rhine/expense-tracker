// src/pages/DailyExpense.jsx
import DailyExpenseForm from "../components/DailyExpenseForm";
import ExpenseSummary from "../components/ExpenseSummary";

import { useState } from "react";

export default function DailyExpense() {
  const [selectedMonth, setSelectedMonth] = useState("");

  return (
    <div className="container mx-auto p-4 mt-20 space-2-6">
      <h2 className="text-xl font-bold text-center text-blue-600">Daily Expenses</h2>
      <div className="max-w-4xl mx-auto">
        <label className="block font-medium mb-1">Select Month (e.g., 2025-06)</label>
        <input
          type="text"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          placeholder="2025-06"
          className="w-full p-3 border-0 border-b-2 border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
        />
      </div>

      {selectedMonth ? (
        <>
          <DailyExpenseForm month={selectedMonth} />
          <ExpenseSummary month={selectedMonth} />
        </>
      ) : (
        <p className="text-center text-gray-500 mt-4">Enter a month to load expenses</p>
      )}
    </div>
  );
}
