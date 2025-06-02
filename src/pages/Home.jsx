// src/pages/Home.jsx
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="p-4 space-y-4 text-center">
      <h1 className="text-2xl font-bold text-blue-600">Expense Tracker</h1>
      <div className="space-y-2">
        <Link to="/monthly" className="block bg-blue-500 text-white p-3 rounded">Monthly Setup</Link>
        <Link to="/daily" className="block bg-green-500 text-white p-3 rounded">Daily Expense</Link>
      </div>
    </div>
  );
}
