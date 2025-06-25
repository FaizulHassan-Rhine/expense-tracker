import React, { useState, useEffect } from "react";
import { ref, get, set, update } from "firebase/database";
import db from "../firebase";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const fixedFields = ["houseRent", "internet"];
const categories = ["transport", "grocery"]; // excluding fixed fields

const DailyExpenseForm = ({ month }) => {
  const [date, setDate] = useState("");
  const [dailyExpenses, setDailyExpenses] = useState({});
  const [otherEntries, setOtherEntries] = useState([{ label: "", amount: "" }]);
  const [loading, setLoading] = useState(false);

  const isFirstFiveDays = () => {
    if (!date) return false;
    const selected = new Date(date);
    return selected.getDate() >= 1 && selected.getDate() <= 5;
  };

  const pushNotification = async (msg) => {
    const id = Date.now().toString();
    await set(ref(db, `notifications/global/${id}`), {
      message: msg,
      read: false,
      timestamp: Date.now(),
    });
  };

  useEffect(() => {
    const checkFixedFields = async () => {
      if (!month) return;
      const today = new Date();
      const currentMonth = today.toISOString().slice(0, 7);
      if (month === currentMonth && today.getDate() <= 5) {
        const firstFiveDays = [...Array(5)].map((_, i) => {
          const d = new Date(today.getFullYear(), today.getMonth(), i + 1);
          return d.toISOString().split("T")[0];
        });
        let isPaid = false;
        for (const d of firstFiveDays) {
          const snap = await get(ref(db, `months/${month}/dailyExpenses/${d}`));
          const data = snap.val();
          if (data && (data.houseRent || data.internet)) {
            isPaid = true;
            break;
          }
        }
        if (!isPaid) {
          toast.warn("House Rent and Internet not filled in first 5 days!");
          await pushNotification("House Rent and Internet bill missing in first 5 days of " + month);
        }
      }
    };
    checkFixedFields();
  }, [month]);

  useEffect(() => {
    if (!month || !date) return;

    const fetchData = async () => {
      try {
        const snapshot = await get(ref(db, `months/${month}/dailyExpenses/${date}`));
        if (snapshot.exists()) {
          const data = snapshot.val();
          const { other, ...rest } = data;
          setDailyExpenses(rest);
          if (other && typeof other === "object") {
            setOtherEntries(
              Object.entries(other).map(([label, amount]) => ({
                label,
                amount: amount.toString(),
              }))
            );
          } else {
            setOtherEntries([{ label: "", amount: "" }]);
          }
        } else {
          setDailyExpenses({ ...categories.concat(fixedFields).reduce((acc, c) => ({ ...acc, [c]: "" }), {}) });
          setOtherEntries([{ label: "", amount: "" }]);
        }
      } catch (err) {
        toast.error("Failed to load daily expenses: " + err.message);
      }
    };

    fetchData();
  }, [month, date]);

  const handleOtherChange = (index, field, value) => {
    const updated = [...otherEntries];
    updated[index][field] = value;
    setOtherEntries(updated);
  };

  const addOtherEntry = () => {
    setOtherEntries([...otherEntries, { label: "", amount: "" }]);
  };

  const removeOtherEntry = (index) => {
    setOtherEntries(otherEntries.filter((_, i) => i !== index));
  };

  const handleChange = (e) => {
    setDailyExpenses({
      ...dailyExpenses,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!month || !date) {
      toast.error("Please select month and date");
      return;
    }

    setLoading(true);
    try {
      const otherObject = {};
      otherEntries.forEach(({ label, amount }) => {
        if (label && amount) {
          otherObject[label] = parseInt(amount) || 0;
        }
      });

      const finalData = {
        ...dailyExpenses,
        other: otherObject,
      };

      await set(ref(db, `months/${month}/dailyExpenses/${date}`), finalData);

      const totalSpentToday =
        [...categories, ...fixedFields].reduce((acc, c) => acc + (parseInt(dailyExpenses[c]) || 0), 0) +
        Object.values(otherObject).reduce((acc, val) => acc + val, 0);

      const summaryRef = ref(db, `months/${month}/summary`);
      const summarySnap = await get(summaryRef);

      if (!summarySnap.exists()) {
        toast.error("Monthly budget not found. Please set it first.");
        setLoading(false);
        return;
      }

      const summary = summarySnap.val();

      const allDailySnap = await get(ref(db, `months/${month}/dailyExpenses`));
      let totalSpentInMonth = 0;

      if (allDailySnap.exists()) {
        const allDays = allDailySnap.val();
        for (const [dayKey, data] of Object.entries(allDays)) {
          if (dayKey !== date) {
            const sum = [...categories, ...fixedFields].reduce(
              (acc, c) => acc + (parseInt(data[c]) || 0),
              0
            );
            const sumOther = data.other
              ? Object.values(data.other).reduce((acc, val) => acc + (parseInt(val) || 0), 0)
              : 0;
            totalSpentInMonth += sum + sumOther;
          }
        }
      }

      const newRemaining = summary.totalBudget - (totalSpentInMonth + totalSpentToday);
      await update(summaryRef, { remaining: newRemaining });

      toast.success("Daily expenses saved!");
    } catch (error) {
      toast.error("Error saving daily expenses: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto bg-white p-4 mt-20 shadow rounded">
      <ToastContainer />
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium">Date</label>
          <input
            type="date"
            value={date}
            min={month ? `${month}-01` : ""}
            max={month ? `${month}-31` : ""}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-2 border rounded"
            disabled={loading || !month}
          />
        </div>

        {isFirstFiveDays() && fixedFields.map((cat) => (
          <div key={cat}>
            <label className="block capitalize font-medium">{cat}</label>
            <input
              type="number"
              name={cat}
              value={dailyExpenses[cat] || ""}
              onChange={handleChange}
              min="0"
              className="w-full p-2 border rounded"
              disabled={loading}
            />
          </div>
        ))}

        {categories.map((cat) => (
          <div key={cat}>
            <label className="block capitalize font-medium">{cat}</label>
            <input
              type="number"
              name={cat}
              value={dailyExpenses[cat] || ""}
              onChange={handleChange}
              min="0"
              className="w-full p-2 border rounded"
              disabled={loading}
            />
          </div>
        ))}

        <div>
          <label className="block font-semibold mb-1">Other Expenses (multiple)</label>
          {otherEntries.map((entry, idx) => (
            <div key={idx} className="flex items-center gap-2 mb-2">
              <input
                type="text"
                placeholder="Label (e.g., Fruits)"
                value={entry.label}
                onChange={(e) => handleOtherChange(idx, "label", e.target.value)}
                className="p-2 border rounded w-1/2"
              />
              <input
                type="number"
                placeholder="Amount"
                value={entry.amount}
                onChange={(e) => handleOtherChange(idx, "amount", e.target.value)}
                className="p-2 border rounded w-1/3"
              />
              <button
                type="button"
                onClick={() => removeOtherEntry(idx)}
                className="text-red-500 font-bold"
              >
                &times;
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addOtherEntry}
            className="mt-1 px-3 py-1 bg-blue-500 text-white rounded"
          >
            + Add Another
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full p-2 rounded text-white ${
            loading ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {loading ? "Saving..." : "Save Daily Expenses"}
        </button>
      </form>
    </div>
  );
};

export default DailyExpenseForm;
