import React, { useState, useEffect } from "react";
import { ref, get, set } from "firebase/database";
import db from "../firebase";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { MonthPicker } from "./ui/month-picker";
import { Wallet } from "lucide-react";

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
    <div className="container mx-auto p-4 sm:p-8 mt-10 sm:mt-20 max-w-full sm:max-w-4xl">
      <ToastContainer position="top-right" autoClose={3000} />
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl sm:text-3xl">Set Monthly Budget</CardTitle>
          </div>
          <CardDescription>
            Plan your monthly expenses by setting budgets for each category
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="month">Select Month</Label>
            <MonthPicker
              value={month}
              onChange={setMonth}
              placeholder="Select month"
              disabled={loading}
            />
          </div>

          {month && (
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {categories.map((cat) => (
                  <div key={cat} className="space-y-2">
                    <Label htmlFor={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1).replace(/([A-Z])/g, " $1").trim()}
                    </Label>
                    <Input
                      id={cat}
                      type="number"
                      min="0"
                      name={cat}
                      value={budgets[cat]}
                      onChange={handleChange}
                      placeholder="0"
                      disabled={loading}
                    />
                  </div>
                ))}
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Budget</p>
                <p className="text-2xl font-bold text-primary">{totalBudget.toLocaleString()} Tk</p>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? "Saving..." : "Save Budget"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MonthlyBudgetInput;
