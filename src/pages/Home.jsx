// src/pages/Home.jsx
import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, Calendar, DollarSign } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import "../index.css";

export default function Home() {
  return (
    <div className="home-banner relative">
      <div className="absolute inset-0" />
      <div className="relative z-10 container mx-auto px-4 py-12 sm:py-16 md:py-20">
        <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
            Take Control of Your Finances
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8">
            Track your expenses, manage your budget, and achieve your financial goals
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="text-lg px-8">
              <Link to="/monthly-budget">
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 bg-gray-100 border-gray-300 text-gray-900 hover:bg-gray-200" asChild>
              <Link to="/dashboard">
                View Dashboard
              </Link>
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mt-12 sm:mt-16 max-w-5xl mx-auto">
          <Card className="bg-white/95 backdrop-blur-sm">
            <CardHeader>
              <DollarSign className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Budget Planning</CardTitle>
              <CardDescription>
                Set monthly budgets for different categories and track your spending
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="bg-white/95 backdrop-blur-sm">
            <CardHeader>
              <Calendar className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Daily Tracking</CardTitle>
              <CardDescription>
                Record your daily expenses and keep a detailed log of all transactions
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="bg-white/95 backdrop-blur-sm">
            <CardHeader>
              <TrendingUp className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Analytics</CardTitle>
              <CardDescription>
                Visualize your spending patterns with charts and detailed reports
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
