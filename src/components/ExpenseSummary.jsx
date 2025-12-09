import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import db from "../firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Receipt, TrendingUp, TrendingDown } from "lucide-react";

export default function ExpenseSummary({ month }) {
  const [summary, setSummary] = useState(null);
  const [dailyExpenses, setDailyExpenses] = useState({});

  const fixedCategories = ["houseRent", "savings", "internet", "electricity"];
  const normalCategories = ["transport", "grocery"];
  const allCategories = [...fixedCategories, ...normalCategories];

  useEffect(() => {
    const summaryRef = ref(db, `months/${month}/summary`);
    const dailyRef = ref(db, `months/${month}/dailyExpenses`);

    const unsubSummary = onValue(summaryRef, (snapshot) => {
      setSummary(snapshot.val());
    });

    const unsubDaily = onValue(dailyRef, (snapshot) => {
      setDailyExpenses(snapshot.val() || {});
    });

    return () => {
      unsubSummary();
      unsubDaily();
    };
  }, [month]);

  if (!summary) {
    return (
      <Card className="mt-6">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading summary...</p>
        </CardContent>
      </Card>
    );
  }

  const getDayTotal = (day) => {
    let total = 0;
    
    // Handle fixed categories (houseRent, savings, internet, electricity)
    fixedCategories.forEach(cat => {
      total += parseInt(day[cat]) || 0;
    });
    
    // Handle normal categories that can be objects (transport, grocery)
    normalCategories.forEach(cat => {
      if (day[cat] && typeof day[cat] === 'object') {
        total += Object.values(day[cat]).reduce((sum, v) => sum + (parseInt(v) || 0), 0);
      } else {
        total += parseInt(day[cat]) || 0;
      }
    });
    
    // Handle other expenses
    if (day.other && typeof day.other === 'object') {
      total += Object.values(day.other).reduce((sum, v) => sum + (parseInt(v) || 0), 0);
    }
    
    return total;
  };

  const totalSpent = Object.values(dailyExpenses).reduce(
    (acc, day) => acc + getDayTotal(day),
    0
  );

  const remaining = summary.remaining || (summary.totalBudget - totalSpent);
  const isOverBudget = remaining < 0;

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-primary" />
          Summary for {month}
        </CardTitle>
        <CardDescription>
          Overview of your monthly budget and expenses
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Budget</p>
            <p className="text-2xl font-bold">{summary.totalBudget?.toLocaleString() || 0} Tk</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Spent</p>
            <p className="text-2xl font-bold text-destructive">{totalSpent.toLocaleString()} Tk</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Remaining Budget</p>
            <div className="flex items-center gap-2">
              <p className={`text-2xl font-bold ${isOverBudget ? 'text-destructive' : 'text-primary'}`}>
                {remaining.toLocaleString()} Tk
              </p>
              {isOverBudget ? (
                <TrendingDown className="h-5 w-5 text-destructive" />
              ) : (
                <TrendingUp className="h-5 w-5 text-primary" />
              )}
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Daily Expenses
          </h4>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {Object.entries(dailyExpenses).sort(([a], [b]) => b.localeCompare(a)).map(([day, data]) => {
              const dayTotal = getDayTotal(data);
              return (
                <Card key={day} className="border-l-4 border-l-primary">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Date: {day}</CardTitle>
                      <Badge variant="outline" className="text-sm font-semibold">
                        Total: {dayTotal.toLocaleString()} Tk
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {allCategories.map((cat) => {
                        const catValue = data[cat];
                        const isObject = catValue && typeof catValue === 'object';
                        const catTotal = isObject 
                          ? Object.values(catValue).reduce((sum, v) => sum + (parseInt(v) || 0), 0)
                          : (parseInt(catValue) || 0);
                        
                        if (catTotal === 0) return null;
                        
                        return (
                          <div key={cat} className="flex items-center justify-between py-1 border-b border-border/50 last:border-0">
                            <span className="font-medium capitalize">{cat.replace(/([A-Z])/g, " $1").trim()}:</span>
                            {isObject ? (
                              <details className="cursor-pointer">
                                <summary className="text-primary hover:underline font-semibold">
                                  {catTotal.toLocaleString()} Tk
                                </summary>
                                <ul className="mt-2 ml-4 space-y-1 text-muted-foreground">
                                  {Object.entries(catValue).map(([label, value], idx) => (
                                    <li key={idx} className="flex justify-between">
                                      <span>{label}:</span>
                                      <span className="font-medium">{parseInt(value).toLocaleString()} Tk</span>
                                    </li>
                                  ))}
                                </ul>
                              </details>
                            ) : (
                              <span className="font-semibold">{catTotal.toLocaleString()} Tk</span>
                            )}
                          </div>
                        );
                      })}
                      {data.other && typeof data.other === "object" && Object.keys(data.other).length > 0 && (
                        <div className="mt-2 pt-2 border-t border-border">
                          <p className="font-medium mb-2">Other Expenses:</p>
                          <ul className="ml-4 space-y-1 text-muted-foreground">
                            {Object.entries(data.other).map(([label, value], idx) => (
                              <li key={idx} className="flex justify-between">
                                <span>{label}:</span>
                                <span className="font-medium">{parseInt(value).toLocaleString()} Tk</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
