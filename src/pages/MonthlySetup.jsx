// src/pages/MonthlySetup.jsx
import MonthlyInputForm from "../components/MonthlyInputForm";
import FixedExpensesForm from "../components/FixedExpensesForm";

export default function MonthlySetup() {
  return (
    <div className="p-4 max-w-xl mx-auto space-y-6">
      <h2 className="text-xl font-bold text-center text-blue-600">Monthly Setup</h2>
      <MonthlyInputForm />
      <FixedExpensesForm />
    </div>
  );
}
