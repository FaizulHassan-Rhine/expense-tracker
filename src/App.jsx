import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import MonthlyBudgetInput from "./components/MonthlyInputForm";
import Dashboard from "./pages/Dashboard";
import NavBar from "./components/Navbar";
import DailyExpense from "./pages/DailyExpense";



function App() {
  const [month, setMonth] = useState("");

  return (
    <Router>
      <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
        <header className="max-w-5xl mx-auto mb-6 flex flex-col sm:flex-row justify-between items-center">
          <h1 className="text-3xl font-extrabold text-blue-700">Expense Tracker</h1>
         <NavBar/>
        </header>

        <main className="max-w-5xl mx-auto">
          <Routes>
            <Route
              path="/monthly-budget"
              element={<MonthlyBudgetInput />}
            />
            <Route
              path="/daily-expenses"
              element={<DailyExpense />}
            />
            <Route
              path="/dashboard"
              element={
                <>
                  <label className="block mb-2">
                    Select Month:
                    <input
                      type="month"
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                      className="block w-40 border rounded p-2 mt-1"
                    />
                  </label>
                  {month && <Dashboard month={month} />}
                </>
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
