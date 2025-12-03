import React, { useState } from "react";
import { ref, get, update } from "firebase/database";
import db from "../firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { MonthPicker } from "../components/ui/month-picker";
import { Badge } from "../components/ui/badge";
import { Settings, Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

export default function AdminTools() {
  const [month, setMonth] = useState("");
  const [message, setMessage] = useState("");
  const [running, setRunning] = useState(false);
  const [messageType, setMessageType] = useState(""); // "success", "error", "info"

  const handleMigration = async () => {
    if (!month) {
      setMessage("Please select a month first.");
      setMessageType("info");
      return;
    }

    setRunning(true);
    setMessage("Migrating old-format 'other' entries...");
    setMessageType("info");

    try {
      const dailyRef = ref(db, `months/${month}/dailyExpenses`);
      const snap = await get(dailyRef);

      if (!snap.exists()) {
        setMessage("No data found for this month.");
        setMessageType("error");
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
        setMessage("No old-format 'other' entries found. No updates needed.");
        setMessageType("success");
      } else {
        await update(ref(db), updates);
        setMessage(`Migration complete. Updated ${changedCount} entries.`);
        setMessageType("success");
      }
    } catch (error) {
      setMessage("Error during migration: " + error.message);
      setMessageType("error");
    } finally {
      setRunning(false);
    }
  };

  const getMessageIcon = () => {
    if (messageType === "success") return <CheckCircle2 className="h-4 w-4" />;
    if (messageType === "error") return <XCircle className="h-4 w-4" />;
    return <AlertCircle className="h-4 w-4" />;
  };

  const getMessageColor = () => {
    if (messageType === "success") return "bg-green-50 border-green-200 text-green-800";
    if (messageType === "error") return "bg-red-50 border-red-200 text-red-800";
    return "bg-blue-50 border-blue-200 text-blue-800";
  };

  return (
    <div className="container mx-auto p-4 sm:p-8 mt-20 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Admin Tools: Migrate Legacy Expenses
          </CardTitle>
          <CardDescription>
            Migrate old-format 'other' expense entries to the new object structure
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Select Month</Label>
            <MonthPicker
              value={month}
              onChange={setMonth}
              placeholder="Select month"
              disabled={running}
            />
          </div>

          <Button
            onClick={handleMigration}
            disabled={running || !month}
            className="w-full sm:w-auto"
            size="lg"
          >
            {running ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Migrating...
              </>
            ) : (
              "Migrate Old 'Other' Entries"
            )}
          </Button>

          {message && (
            <div className={`mt-4 p-4 border rounded-md flex items-center gap-2 ${getMessageColor()}`}>
              {getMessageIcon()}
              <span className="text-sm font-medium">{message}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
