import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Lock, LogIn } from "lucide-react";
import { toast } from "../components/ui/use-toast";

const AdminLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // Check if already logged in
  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin");
    if (isAdmin === "true") {
      navigate("/admin-panel", { replace: true });
    }
  }, [navigate]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === "admin" && password === "1234") {
      try {
        // Set localStorage first
        localStorage.setItem("isAdmin", "true");
        
        // Verify it was set
        const verify = localStorage.getItem("isAdmin");
        if (verify !== "true") {
          toast({
            title: "Error",
            description: "Failed to save login session. Please try again.",
            variant: "error",
          });
          return;
        }

        toast({
          title: "Login successful",
          description: "Welcome to the admin panel",
          variant: "success",
        });
        
        // Navigate immediately - React Router will handle it
        navigate("/admin-panel", { replace: true });
      } catch (error) {
        console.error("Login error:", error);
        toast({
          title: "Error",
          description: "Failed to save login: " + (error.message || "Unknown error"),
          variant: "error",
        });
      }
    } else {
      toast({
        title: "Invalid credentials",
        description: "Please check your username and password",
        variant: "error",
      });
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-8 mt-20 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Admin Login
          </CardTitle>
          <CardDescription>
            Enter your credentials to access the admin panel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" size="lg">
              <LogIn className="mr-2 h-4 w-4" />
              Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
