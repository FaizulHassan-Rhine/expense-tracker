import React, { useState, useEffect } from "react";
import { ref, get, set } from "firebase/database";
import db from "../firebase";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const categories = [
  "houseRent",  // fixed
  "savings",    // new savings input
  "internet",   // fixed
  "transport",
  "grocery",
  "electricity",
  "other",
];

const MonthlyBudgetInput = () => {
  const [month, setMonth] = useState("");
  const [budgets, setBudgets] = useState(
    categories.reduce((acc, c) => ({ ...acc, [c]: "" }), {})
  );
  const [loading, setLoading] = useState(false);
  const [totalBudget, setTotalBudget] = useState(0);

  useEffect(() => {
    if (!month) return;

    const fetchBudget = async () => {
      try {
        const budgetRef = ref(db, `months/${month}/summary`);
        const snapshot = await get(budgetRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          const filtered = {};
          categories.forEach((c) => {
            filtered[c] = data[c] || "";
          });
          setBudgets(filtered);
          setTotalBudget(data.totalBudget || 0);
        } else {
          setBudgets(categories.reduce((acc, c) => ({ ...acc, [c]: "" }), {}));
          setTotalBudget(0);
        }
      } catch (error) {
        toast.error("Failed to load budget: " + error.message);
      }
    };

    fetchBudget();
  }, [month]);

  useEffect(() => {
    const total = categories.reduce(
      (acc, c) => acc + (parseInt(budgets[c]) || 0),
      0
    );
    setTotalBudget(total);
  }, [budgets]);

  const handleChange = (e) => {
    setBudgets({
      ...budgets,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!month) {
      toast.error("Please select a month");
      return;
    }
    setLoading(true);
    try {
      const summaryRef = ref(db, `months/${month}/summary`);
      const snapshot = await get(summaryRef);
      let remaining = totalBudget;
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data.totalBudget !== totalBudget) {
          remaining = totalBudget;
        } else {
          remaining = data.remaining || totalBudget;
        }
      }

      await set(summaryRef, {
        ...budgets,
        totalBudget,
        remaining,
      });

      toast.success("Monthly budget saved!");
    } catch (error) {
      toast.error("Error saving budget: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 bg-white shadow-xl rounded-2xl mt-20 max-w-4xl">
      <ToastContainer position="top-right" autoClose={3000} />
      <h2 className="text-2xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">Set Monthly Budget</h2>

      <label className="block mb-2 font-semibold text-blue-700">
        Select Month:
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="block w-full border-0 border-b-2 border-gray-200 rounded-lg p-3 mt-1 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          disabled={loading}
        />
      </label>

      {month && (
        <form onSubmit={handleSubmit}>
          {categories.map((cat) => (
            <label key={cat} className="block mb-3 font-semibold text-blue-700">
              {cat.charAt(0).toUpperCase() + cat.slice(1)}:
              <input
                type="number"
                min="0"
                name={cat}
                value={budgets[cat]}
                onChange={handleChange}
                className="block w-full border-0 border-b-2 border-gray-200 rounded-lg p-3 mt-1 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                disabled={loading}
              />
            </label>
          ))}

          <p className="mb-4 font-semibold text-blue-700">Total Budget: {totalBudget} Tk</p>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl text-white font-bold shadow-md transition bg-gradient-to-r cursor-pointer from-green-600 to-green-400 hover:from-green-800 hover:to-green-600 ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            {loading ? "Saving..." : "Save Budget"}
          </button>
        </form>
      )}
    </div>
  );
};

export default MonthlyBudgetInput;
