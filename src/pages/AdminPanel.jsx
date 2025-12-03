import React, { useEffect, useState } from "react";
import { ref, get, remove, set } from "firebase/database";
import db from "../firebase";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";
import { MonthPicker } from "../components/ui/month-picker";
import { Shield, LogOut, Trash2, Edit, Download, Calendar, FileText } from "lucide-react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { toast } from "../components/ui/use-toast";

const AdminPanel = () => {
  // Check admin status immediately on mount (synchronously)
  const initialAdminCheck = () => {
    try {
      const isAdmin = localStorage.getItem("isAdmin");
      return isAdmin === "true";
    } catch {
      return false;
    }
  };

  const [months, setMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [days, setDays] = useState({});
  const [isLoading, setIsLoading] = useState(!initialAdminCheck()); // Only show loading if not admin
  const [hasError, setHasError] = useState(false);
  const navigate = useNavigate();
  const [deleteDayDialog, setDeleteDayDialog] = useState({ open: false, date: null });
  const [deleteMonthDialog, setDeleteMonthDialog] = useState(false);

  // Always ensure we have a visible component
  console.log("AdminPanel rendering, isLoading:", isLoading);

  useEffect(() => {
    const checkAdminAndFetch = async () => {
      try {
        // Check admin status
        let isAdmin;
        try {
          isAdmin = localStorage.getItem("isAdmin");
          console.log("AdminPanel - isAdmin from localStorage:", isAdmin);
        } catch (storageError) {
          console.error("Error accessing localStorage:", storageError);
          setIsLoading(false);
          setHasError(true);
          toast({
            title: "Error",
            description: "Cannot access browser storage. Please check your browser settings.",
            variant: "error",
          });
          setTimeout(() => navigate("/admin-login", { replace: true }), 1000);
          return;
        }

        if (!isAdmin || isAdmin !== "true") {
          console.log("AdminPanel - Not admin, redirecting to login");
          setIsLoading(false);
          setTimeout(() => navigate("/admin-login", { replace: true }), 100);
          return;
        }

        console.log("AdminPanel - Admin verified, loading data");

        // Set loading to false immediately so content can render
        setIsLoading(false);
        setHasError(false);

        // Then fetch months (don't block rendering)
        try {
          const snap = await get(ref(db, "months"));
          if (snap.exists()) {
            setMonths(Object.keys(snap.val()));
          } else {
            setMonths([]);
          }
        } catch (fetchError) {
          console.error("Error fetching months:", fetchError);
          // Don't set hasError to true for fetch errors, just show toast
          toast({
            title: "Error",
            description: "Failed to load months: " + (fetchError.message || "Unknown error"),
            variant: "error",
          });
        }
      } catch (error) {
        console.error("Error in AdminPanel:", error);
        setIsLoading(false);
        setHasError(true);
        toast({
          title: "Error",
          description: "Failed to initialize: " + (error.message || "Unknown error"),
          variant: "error",
        });
      }
    };

    checkAdminAndFetch();
  }, [navigate]);

  const loadMonthData = async (month) => {
    if (!month) {
      setDays({});
      return;
    }
    try {
      setSelectedMonth(month);
      const snap = await get(ref(db, `months/${month}/dailyExpenses`));
      setDays(snap.exists() ? snap.val() : {});
    } catch (error) {
      console.error("Error loading month data:", error);
      toast({
        title: "Error",
        description: "Failed to load month data: " + (error.message || "Unknown error"),
        variant: "error",
      });
      setDays({});
    }
  };

  const deleteDay = async (date) => {
    setDeleteDayDialog({ open: true, date });
  };

  const handleDeleteDay = async () => {
    if (!deleteDayDialog.date || !selectedMonth) {
      toast({
        title: "Error",
        description: "Missing information to delete",
        variant: "error",
      });
      return;
    }

    try {
      await remove(ref(db, `months/${selectedMonth}/dailyExpenses/${deleteDayDialog.date}`));
      toast({
        title: "Deleted successfully",
        description: `${deleteDayDialog.date} has been deleted`,
        variant: "success",
      });
      await loadMonthData(selectedMonth);
      setDeleteDayDialog({ open: false, date: null });
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Error",
        description: "Failed to delete entry: " + (error.message || "Unknown error"),
        variant: "error",
      });
      throw error; // Re-throw so dialog can handle it
    }
  };

  const deleteMonth = () => {
    setDeleteMonthDialog(true);
  };

  const handleDeleteMonth = async () => {
    if (!selectedMonth) {
      toast({
        title: "Error",
        description: "No month selected",
        variant: "error",
      });
      return;
    }

    try {
      await remove(ref(db, `months/${selectedMonth}`));
      toast({
        title: "Month deleted",
        description: `All data for ${selectedMonth} has been deleted successfully`,
        variant: "success",
      });
      setSelectedMonth("");
      setDays({});
      const snap = await get(ref(db, "months"));
      if (snap.exists()) {
        setMonths(Object.keys(snap.val()));
      } else {
        setMonths([]);
      }
      setDeleteMonthDialog(false);
    } catch (error) {
      console.error("Delete month error:", error);
      toast({
        title: "Error",
        description: "Failed to delete month: " + (error.message || "Unknown error"),
        variant: "error",
      });
      throw error; // Re-throw so dialog can handle it
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
    
    toast({
      title: "Export successful",
      description: `CSV file downloaded for ${selectedMonth}`,
      variant: "success",
    });
  };

  // Show loading state while checking admin status
  if (isLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-8 mt-20 max-w-6xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Admin Panel
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state if something went wrong
  if (hasError) {
    return (
      <div className="container mx-auto p-4 sm:p-8 mt-20 max-w-6xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Admin Panel
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-destructive mb-4">An error occurred. Please refresh the page.</p>
              <Button onClick={() => window.location.reload()}>Refresh Page</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-8 mt-20 max-w-6xl">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Admin Panel
              </CardTitle>
              <CardDescription>
                Manage and view all expense data
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                localStorage.removeItem("isAdmin");
                navigate("/admin-login");
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Select Month</Label>
            <div className="flex gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => loadMonthData(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">-- Select Month --</option>
                {months.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {selectedMonth && (
            <>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Daily Records for {selectedMonth}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {Object.keys(days).length} day{Object.keys(days).length !== 1 ? 's' : ''} recorded
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={exportCSV}
                    variant="outline"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                  <Button
                    onClick={deleteMonth}
                    variant="destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Month
                  </Button>
                </div>
              </div>

              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {Object.entries(days).map(([date, data]) => (
                  <Card key={date}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{date}</Badge>
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const json = prompt("Edit as JSON:", JSON.stringify(data, null, 2));
                              if (!json) return;
                              try {
                                const parsed = JSON.parse(json);
                                set(ref(db, `months/${selectedMonth}/dailyExpenses/${date}`), parsed).then(() => {
                                  toast({
                                    title: "Updated successfully",
                                    description: `${date} has been updated`,
                                    variant: "success",
                                  });
                                  loadMonthData(selectedMonth);
                                });
                              } catch (err) {
                                toast({
                                  title: "Invalid JSON",
                                  description: "Please check your JSON syntax and try again",
                                  variant: "error",
                                });
                              }
                            }}
                          >
                            <Edit className="mr-2 h-3 w-3" />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteDay(date)}
                          >
                            <Trash2 className="mr-2 h-3 w-3" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-40 font-mono">
                        {JSON.stringify(data, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          {!selectedMonth && (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a month to view daily expense records</p>
            </div>
          )}
        </CardContent>
      </Card>

      {deleteDayDialog.open && (
        <ConfirmDialog
          open={deleteDayDialog.open}
          onOpenChange={(open) => setDeleteDayDialog({ open, date: deleteDayDialog.date })}
          onConfirm={handleDeleteDay}
          title="Delete Daily Record"
          description={`Are you sure you want to delete ${deleteDayDialog.date} from ${selectedMonth}? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="destructive"
        />
      )}

      {deleteMonthDialog && (
        <ConfirmDialog
          open={deleteMonthDialog}
          onOpenChange={setDeleteMonthDialog}
          onConfirm={handleDeleteMonth}
          title="Delete Entire Month"
          description={`⚠️ This will permanently delete all data for ${selectedMonth}. This action cannot be undone.`}
          confirmText="Delete Month"
          cancelText="Cancel"
          variant="destructive"
        />
      )}
    </div>
  );
};

export default AdminPanel;
