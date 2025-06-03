import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import MonthlyBudgetInput from "./components/MonthlyInputForm";
import Dashboard from "./pages/Dashboard";
import NavBar from "./components/Navbar";
import DailyExpense from "./pages/DailyExpense";
import AdminTools from "./pages/AdminTools";
import AdminLogin from "./pages/AdminLogin";
import AdminPanel from "./pages/AdminPanel";
import Home from "./pages/Home";
import Footer from "./components/Footer";

function App() {

  return (
    <Router>
     <div className="pb-16">
       <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/monthly-budget" element={<MonthlyBudgetInput />} />
        <Route path="/daily-expenses" element={<DailyExpense />} />
        <Route path="/admin-tools" element={<AdminTools />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin-panel" element={<AdminPanel />} />
        <Route
          path="/dashboard"
          element={
            
           
              <Dashboard />
              }
        />
      </Routes>
      <Footer/>
     </div>
    </Router>
  );
}

export default App;
