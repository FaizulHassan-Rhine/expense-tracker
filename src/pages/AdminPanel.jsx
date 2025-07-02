import React, { useEffect, useState } from "react";
import { ref, get, remove } from "firebase/database";
import db from "../firebase";
import { useNavigate } from "react-router-dom";

const AdminPanel = () => {
  const [months, setMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [days, setDays] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin");
    if (!isAdmin) navigate("/admin-login");

    const fetchMonths = async () => {
      const snap = await get(ref(db, "months"));
      if (snap.exists()) setMonths(Object.keys(snap.val()));
    };

    fetchMonths();
  }, [navigate]);

  const loadMonthData = async (month) => {
    setSelectedMonth(month);
    const snap = await get(ref(db, `months/${month}/dailyExpenses`));
    setDays(snap.exists() ? snap.val() : {});
  };

  const deleteDay = async (date) => {
    if (window.confirm(`Delete ${date} from ${selectedMonth}?`)) {
      await remove(ref(db, `months/${selectedMonth}/dailyExpenses/${date}`));
      loadMonthData(selectedMonth);
    }
  };

  const deleteMonth = async () => {
    if (window.confirm(`⚠️ This will delete all data for ${selectedMonth}. Continue?`)) {
      await remove(ref(db, `months/${selectedMonth}`));
      setSelectedMonth("");
      setDays({});
      const snap = await get(ref(db, "months"));
      setMonths(Object.keys(snap.val() || {}));
    }
  };

  const exportCSV = () => {
    if (!selectedMonth || !days) return;

    let csv = "Date,Transport,HouseRent,Grocery,Electricity,Internet,Other,Total\n";

    Object.entries(days).forEach(([date, data]) => {
      const fixed = ["transport", "houseRent", "grocery", "electricity", "internet"].map((cat) => data[cat] || 0);
      const other = data.other && typeof data.other === "object"
        ? Object.entries(data.other).map(([k, v]) => `${k}:${v}`).join(" | ")
        : data.other || "";

      const total = fixed.reduce((a, b) => parseInt(a) + parseInt(b), 0) +
        (typeof data.other === "object"
          ? Object.values(data.other).reduce((a, b) => parseInt(a) + parseInt(b), 0)
          : parseInt(data.other || 0));

      csv += `${date},${fixed.join(",")},${other},${total}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${selectedMonth}_expenses.csv`;
    link.click();
  };

  return (
    <div className="container mx-auto mt-10 sm:mt-20 p-4 sm:p-6 bg-white shadow rounded">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-blue-700">Admin Panel</h2>
        <button
          onClick={() => {
            localStorage.removeItem("isAdmin");
            navigate("/admin-login");
          }}
          className="text-sm px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded"
        >
          Logout
        </button>
      </div>

      <div className="mb-4">
        <label>Select Month:</label>
        <select
          value={selectedMonth}
          onChange={(e) => loadMonthData(e.target.value)}
          className="block w-full p-2 sm:p-3 border-0 border-b-2 border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
        >
          <option value="">-- Select Month --</option>
          {months.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {selectedMonth && (
        <>
          <div className="mb-4 flex justify-between items-center">
            <h3 className="font-semibold text-lg">Daily Records for {selectedMonth}</h3>
            <button
              onClick={deleteMonth}
              className="py-2 px-4 rounded-xl text-white font-bold shadow-md transition bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              Delete Entire Month
            </button>
          </div>

          <ul className="space-y-2 max-h-96 overflow-y-auto text-xs sm:text-sm">
            {Object.entries(days).map(([date, data]) => (
              <li key={date} className="border p-3 rounded">
                <div className="flex justify-between items-center mb-2">
                  <strong>{date}</strong>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const json = prompt("Edit as JSON:", JSON.stringify(data, null, 2));
                        if (!json) return;
                        try {
                          const parsed = JSON.parse(json);
                          set(ref(db, `months/${selectedMonth}/dailyExpenses/${date}`), parsed).then(() =>
                            loadMonthData(selectedMonth)
                          );
                        } catch (err) {
                          alert("Invalid JSON");
                        }
                      }}
                      className="text-blue-600 underline text-xs"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteDay(date)}
                      className="text-red-500 underline text-xs"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <pre className="text-xs sm:text-xs bg-gray-50 p-2 rounded overflow-auto max-h-40">{JSON.stringify(data, null, 2)}</pre>
              </li>
            ))}
          </ul>

          <div className="text-right mt-4">
            <button
              onClick={exportCSV}
              className="py-2 px-4 rounded-xl text-white font-bold shadow-md transition bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 w-full sm:w-auto"
            >
              Export to CSV
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminPanel;
