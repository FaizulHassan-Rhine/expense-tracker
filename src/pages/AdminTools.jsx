import React, { useState } from "react";
import { ref, get, update } from "firebase/database";
import db from "../firebase";

export default function AdminTools() {
  const [month, setMonth] = useState("");
  const [message, setMessage] = useState("");
  const [running, setRunning] = useState(false);

  const handleMigration = async () => {
    if (!month) {
      setMessage("⚠️ Please select a month first.");
      return;
    }

    setRunning(true);
    setMessage("⏳ Migrating old-format 'other' entries...");

    try {
      const dailyRef = ref(db, `months/${month}/dailyExpenses`);
      const snap = await get(dailyRef);

      if (!snap.exists()) {
        setMessage("❌ No data found for this month.");
        setRunning(false);
        return;
      }

      const data = snap.val();
      const updates = {};
      let changedCount = 0;

      Object.entries(data).forEach(([date, entry]) => {
        if (typeof entry.other === "number") {
          updates[`months/${month}/dailyExpenses/${date}/other`] = {
            misc: entry.other,
          };
          changedCount++;
        }
      });

      if (changedCount === 0) {
        setMessage("✅ No old-format 'other' entries found. No updates needed.");
      } else {
        await update(ref(db), updates);
        setMessage(`✅ Migration complete. Updated ${changedCount} entries.`);
      }
    } catch (error) {
      setMessage("❌ Error during migration: " + error.message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="container mx-auto bg-white shadow p-6 mt-20 rounded">
      <h2 className="text-xl font-bold mb-4 text-blue-700">Admin Tools: Migrate Legacy Expenses</h2>

      <label className="block mb-2 font-medium">
        Select Month:
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="block w-full border rounded p-2 mt-1"
          disabled={running}
        />
      </label>

      <button
        onClick={handleMigration}
        disabled={running || !month}
        className={`w-full mt-4 py-2 rounded text-white ${
          running ? "bg-gray-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
        }`}
      >
        {running ? "Migrating..." : "Migrate Old 'Other' Entries"}
      </button>

      {message && (
        <div className="mt-4 p-3 bg-gray-100 border rounded text-sm">
          {message}
        </div>
      )}
    </div>
  );
}
