// src/pages/DailyExpense.jsx
import DailyExpenseForm from "../components/DailyExpenseForm";
import ExpenseSummary from "../components/ExpenseSummary";

import { useState } from "react";

export default function DailyExpense() {
  const [selectedMonth, setSelectedMonth] = useState("");

  return (
    <div className="max-w-xl mx-auto p-4 space-y-6">
      <h2 className="text-xl font-bold text-center text-blue-600">Daily Expenses</h2>
      <div>
        <label className="block font-medium mb-1">Select Month (e.g., June-2025)</label>
        <input
          type="text"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          placeholder="June-2025"
          className="w-full p-2 border rounded"
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
