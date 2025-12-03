// src/pages/DailyExpense.jsx
import DailyExpenseForm from "../components/DailyExpenseForm";
import ExpenseSummary from "../components/ExpenseSummary";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { MonthPicker } from "../components/ui/month-picker";
import { Label } from "../components/ui/label";
import { Calendar } from "lucide-react";
import { useState } from "react";

export default function DailyExpense() {
  const [selectedMonth, setSelectedMonth] = useState("");

  return (
    <div className="container mx-auto p-4 sm:p-8 mt-20 max-w-4xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Select Month
          </CardTitle>
          <CardDescription>
            Choose a month to view and manage daily expenses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Month</Label>
            <MonthPicker
              value={selectedMonth}
              onChange={setSelectedMonth}
              placeholder="Select month"
            />
          </div>
        </CardContent>
      </Card>

      {selectedMonth ? (
        <>
          <DailyExpenseForm month={selectedMonth} />
          <ExpenseSummary month={selectedMonth} />
        </>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Please select a month to view expenses</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
