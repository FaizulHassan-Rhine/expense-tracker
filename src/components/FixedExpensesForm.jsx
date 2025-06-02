// src/components/FixedExpensesForm.jsx
import { useState } from "react";
import { ref, set } from "firebase/database";
import db from "../firebase";

export default function FixedExpensesForm() {
  const [month, setMonth] = useState("");
  const [expenses, setExpenses] = useState({
    rent: "",
    groceries: "",
    transport: "",
    other: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!month) return alert("Month required");

    set(ref(db, `months/${month}/fixed`), {
      rent: parseInt(expenses.rent) || 0,
      groceries: parseInt(expenses.groceries) || 0,
      transport: parseInt(expenses.transport) || 0,
      other: parseInt(expenses.other) || 0,
    });

    alert("Fixed Expenses Saved!");
    setExpenses({ rent: "", groceries: "", transport: "", other: "" });
  };

  const updateField = (field, value) => {
    setExpenses((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded shadow">
      <div>
        <label className="block font-medium">Month (same as above)</label>
        <input
          type="text"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          placeholder="June-2025"
          className="w-full p-2 border rounded"
        />
      </div>

      {["rent", "groceries", "transport", "other"].map((field) => (
        <div key={field}>
          <label className="block capitalize font-medium">{field}</label>
          <input
            type="number"
            value={expenses[field]}
            onChange={(e) => updateField(field, e.target.value)}
            placeholder={`Enter ${field} amount`}
            className="w-full p-2 border rounded"
          />
        </div>
      ))}

      <button type="submit" className="bg-green-500 text-white w-full p-2 rounded">Save Fixed Expenses</button>
    </form>
  );
}
