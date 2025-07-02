import React, { useState, useEffect } from "react";
import { ref, get, set, update } from "firebase/database";
import db from "../firebase";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const fixedFields = ["houseRent", "savings", "internet", "electricity"];
const categories = ["transport", "grocery"];

const DailyExpenseForm = ({ month }) => {
  const [date, setDate] = useState("");
  const [dailyExpenses, setDailyExpenses] = useState({});
  const [otherEntries, setOtherEntries] = useState([{ label: "", amount: "" }]);
  const [groceryEntries, setGroceryEntries] = useState([{ label: "", amount: "" }]);
  const [transportEntries, setTransportEntries] = useState([{ label: "", amount: "" }]);
  const [loading, setLoading] = useState(false);
  const [fixedFieldsToShow, setFixedFieldsToShow] = useState(fixedFields);

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
          const { other, grocery, transport, ...rest } = data;
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
          if (grocery && typeof grocery === "object") {
            setGroceryEntries(
              Object.entries(grocery).map(([label, amount]) => ({
                label,
                amount: amount.toString(),
              }))
            );
          } else {
            setGroceryEntries([{ label: "", amount: "" }]);
          }
          if (transport && typeof transport === "object") {
            setTransportEntries(
              Object.entries(transport).map(([label, amount]) => ({
                label,
                amount: amount.toString(),
              }))
            );
          } else {
            setTransportEntries([{ label: "", amount: "" }]);
          }
        } else {
          setDailyExpenses({ ...categories.concat(fixedFields).reduce((acc, c) => ({ ...acc, [c]: "" }), {}) });
          setOtherEntries([{ label: "", amount: "" }]);
          setGroceryEntries([{ label: "", amount: "" }]);
          setTransportEntries([{ label: "", amount: "" }]);
        }
      } catch (err) {
        toast.error("Failed to load daily expenses: " + err.message);
      }
    };

    fetchData();
  }, [month, date]);

  useEffect(() => {
    async function checkFixedFieldsEntered() {
      if (!month) return;
      const allDailySnap = await get(ref(db, `months/${month}/dailyExpenses`));
      if (!allDailySnap.exists()) {
        setFixedFieldsToShow(fixedFields);
        return;
      }
      const allDays = allDailySnap.val();
      const entered = new Set();
      for (const dayData of Object.values(allDays)) {
        fixedFields.forEach((field) => {
          if (dayData[field] && dayData[field] !== "") {
            entered.add(field);
          }
        });
      }
      setFixedFieldsToShow(fixedFields.filter((f) => !entered.has(f)));
    }
    checkFixedFieldsEntered();
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

  const handleGroceryChange = (index, field, value) => {
    const updated = [...groceryEntries];
    updated[index][field] = value;
    setGroceryEntries(updated);
  };

  const addGroceryEntry = () => {
    setGroceryEntries([...groceryEntries, { label: "", amount: "" }]);
  };

  const removeGroceryEntry = (index) => {
    setGroceryEntries(groceryEntries.filter((_, i) => i !== index));
  };

  const handleTransportChange = (index, field, value) => {
    const updated = [...transportEntries];
    updated[index][field] = value;
    setTransportEntries(updated);
  };

  const addTransportEntry = () => {
    setTransportEntries([...transportEntries, { label: "", amount: "" }]);
  };

  const removeTransportEntry = (index) => {
    setTransportEntries(transportEntries.filter((_, i) => i !== index));
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
      const groceryObject = {};
      groceryEntries.forEach(({ label, amount }) => {
        if (label && amount) {
          groceryObject[label] = parseInt(amount) || 0;
        }
      });
      const transportObject = {};
      transportEntries.forEach(({ label, amount }) => {
        if (label && amount) {
          transportObject[label] = parseInt(amount) || 0;
        }
      });
      const finalData = {
        ...dailyExpenses,
        grocery: groceryObject,
        transport: transportObject,
        other: otherObject,
      };

      await set(ref(db, `months/${month}/dailyExpenses/${date}`), finalData);

      const sumGrocery = Object.values(groceryObject).reduce((acc, val) => acc + val, 0);
      const sumTransport = Object.values(transportObject).reduce((acc, val) => acc + val, 0);
      const totalSpentToday =
        [...categories, ...fixedFields].reduce((acc, c) => acc + (parseInt(dailyExpenses[c]) || 0), 0) +
        sumGrocery + sumTransport +
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
            const sumGrocery = data.grocery
              ? Object.values(data.grocery).reduce((acc, val) => acc + (parseInt(val) || 0), 0)
              : 0;
            const sumTransport = data.transport
              ? Object.values(data.transport).reduce((acc, val) => acc + (parseInt(val) || 0), 0)
              : 0;
            const sumOther = data.other
              ? Object.values(data.other).reduce((acc, val) => acc + (parseInt(val) || 0), 0)
              : 0;
            totalSpentInMonth += sum + sumGrocery + sumTransport + sumOther;
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
    <div className="container mx-auto bg-white p-4 sm:p-8 mt-10 sm:mt-20 shadow-xl rounded-2xl max-w-full sm:max-w-4xl">
      <ToastContainer />
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div>
          <label className="block font-semibold text-blue-700 mb-1">Date</label>
          <input
            type="date"
            value={date}
            min={month ? `${month}-01` : ""}
            max={month ? `${month}-31` : ""}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-2 sm:p-3 border-0 border-b-2 border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
            disabled={loading || !month}
          />
        </div>

        {fixedFieldsToShow.map((cat) => (
          <div key={cat}>
            <label className="block capitalize font-medium">{cat}</label>
            <input
              type="number"
              name={cat}
              value={dailyExpenses[cat] || ""}
              onChange={handleChange}
              min="0"
              className="w-full p-2 sm:p-3 border-0 border-b-2 border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
              disabled={loading}
            />
          </div>
        ))}

        {/* Grocery multi-input */}
        <div>
          <label className="block font-semibold mb-1">Grocery (multiple)</label>
          {groceryEntries.map((entry, idx) => (
            <div key={idx} className="flex items-center gap-2 mb-2 flex-col sm:flex-row">
              <input
                type="text"
                placeholder="Label (e.g., Rice)"
                value={entry.label}
                onChange={(e) => handleGroceryChange(idx, "label", e.target.value)}
                className="w-full p-2 sm:p-3 border-0 border-b-2 border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
              />
              <input
                type="number"
                placeholder="Amount"
                value={entry.amount}
                onChange={(e) => handleGroceryChange(idx, "amount", e.target.value)}
                className="w-full p-2 sm:p-3 border-0 border-b-2 border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
              />
              <button
                type="button"
                onClick={() => removeGroceryEntry(idx)}
                className="text-red-500 font-bold"
              >
                &times;
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addGroceryEntry}
            className="mt-1 px-3 py-1 cursor-pointer bg-blue-500 text-white rounded w-full sm:w-auto"
          >
            + Add Another
          </button>
        </div>
        {/* Transport multi-input */}
        <div>
          <label className="block font-semibold mb-1">Transport (multiple)</label>
          {transportEntries.map((entry, idx) => (
            <div key={idx} className="flex items-center gap-2 mb-2 flex-col sm:flex-row">
              <input
                type="text"
                placeholder="Label (e.g., Bus Fare)"
                value={entry.label}
                onChange={(e) => handleTransportChange(idx, "label", e.target.value)}
                className="w-full p-2 sm:p-3 border-0 border-b-2 border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
              />
              <input
                type="number"
                placeholder="Amount"
                value={entry.amount}
                onChange={(e) => handleTransportChange(idx, "amount", e.target.value)}
                className="w-full p-2 sm:p-3 border-0 border-b-2 border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
              />
              <button
                type="button"
                onClick={() => removeTransportEntry(idx)}
                className="text-red-500 font-bold"
              >
                &times;
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addTransportEntry}
            className="mt-1 px-3 py-1 cursor-pointer bg-blue-500 text-white rounded w-full sm:w-auto"
          >
            + Add Another
          </button>
        </div>
        {/* Other Expenses multi-input */}
        <div>
          <label className="block font-semibold mb-1">Other Expenses (multiple)</label>
          {otherEntries.map((entry, idx) => (
            <div key={idx} className="flex items-center gap-2 mb-2 flex-col sm:flex-row">
              <input
                type="text"
                placeholder="Label (e.g., Fruits)"
                value={entry.label}
                onChange={(e) => handleOtherChange(idx, "label", e.target.value)}
                className="w-full p-2 sm:p-3 border-0 border-b-2 border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
              />
              <input
                type="number"
                placeholder="Amount"
                value={entry.amount}
                onChange={(e) => handleOtherChange(idx, "amount", e.target.value)}
                className="w-full p-2 sm:p-3 border-0 border-b-2 border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
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
            className="mt-1 px-3 py-1 cursor-pointer bg-blue-500 text-white rounded w-full sm:w-auto"
          >
            + Add Another
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 sm:py-3 rounded-xl cursor-pointer text-white font-bold shadow-md transition bg-gradient-to-r from-green-600 to-green-400 hover:from-green-800 hover:to-green-600 ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          {loading ? "Saving..." : "Save Daily Expenses"}
        </button>
      </form>
    </div>
  );
};

export default DailyExpenseForm;
