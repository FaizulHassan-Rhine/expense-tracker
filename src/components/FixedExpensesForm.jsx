// src/components/FixedExpensesForm.jsx
import { useState } from "react";
import { ref, set } from "firebase/database";
import db from "../firebase";
import { toast } from "./ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";

export default function FixedExpensesForm({ showCard = true }) {
  const [month, setMonth] = useState("");
  const [expenses, setExpenses] = useState({
    rent: "",
    groceries: "",
    transport: "",
    other: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!month) {
      toast({
        title: "Month required",
        description: "Please select a month",
        variant: "warning",
      });
      return;
    }

    set(ref(db, `months/${month}/fixed`), {
      rent: parseInt(expenses.rent) || 0,
      groceries: parseInt(expenses.groceries) || 0,
      transport: parseInt(expenses.transport) || 0,
      other: parseInt(expenses.other) || 0,
    });

    toast({
      title: "Fixed expenses saved",
      description: "Your fixed expenses have been saved successfully",
      variant: "success",
    });
    setExpenses({ rent: "", groceries: "", transport: "", other: "" });
  };

  const updateField = (field, value) => {
    setExpenses((prev) => ({ ...prev, [field]: value }));
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      <div className="space-y-2">
        <Label htmlFor="fixed-month" className="text-sm sm:text-base font-medium">Month</Label>
        <Input
          id="fixed-month"
          type="text"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          placeholder="2025-01"
          className="text-sm"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {["rent", "groceries", "transport", "other"].map((field) => (
          <div key={field} className="space-y-1 sm:space-y-2">
            <Label htmlFor={`fixed-${field}`} className="text-xs sm:text-sm font-medium capitalize">
              {field}
            </Label>
            <Input
              id={`fixed-${field}`}
              type="number"
              min="0"
              value={expenses[field]}
              onChange={(e) => updateField(field, e.target.value)}
              placeholder="0"
              className="text-sm"
            />
          </div>
        ))}
      </div>

      <Button type="submit" className="w-full" size="lg">
        Save Fixed Expenses
      </Button>
    </form>
  );

  return showCard ? (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg sm:text-xl md:text-2xl">Fixed Expenses</CardTitle>
        <CardDescription className="text-xs sm:text-sm mt-1">
          Set your fixed monthly expenses (optional)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        {formContent}
      </CardContent>
    </Card>
  ) : (
    <div className="space-y-4 sm:space-y-6">
      {formContent}
    </div>
  );
}
