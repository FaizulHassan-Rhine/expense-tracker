import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Wallet } from "lucide-react";
import { Button } from "./ui/button";
import NotificationMenu from "./NotificationMenu";

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-background border-b border-border text-foreground p-2 sm:p-4 shadow-sm fixed top-0 w-full z-50">
      <div className="flex flex-row items-center justify-between container mx-auto px-2 sm:px-4">
        <div className="flex-1 flex justify-center md:justify-start">
          <Link to="/" className="flex items-center gap-2 text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            <Wallet className="h-6 w-6 text-primary" />
            Expense Tracker
          </Link>
        </div>
        <div className="md:hidden flex-1 flex justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(!isOpen)}
            className="ml-2"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
        <div className="hidden md:flex flex-1 items-center gap-4 justify-end">
          <Button variant="ghost" asChild>
            <Link to="/monthly-budget">Monthly Budget</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/daily-expenses">Daily Expenses</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/dashboard">Dashboard</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/admin-tools">Admin Tools</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/admin-login">Admin</Link>
          </Button>
          <NotificationMenu />
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden flex flex-col gap-2 mt-4 px-2 sm:px-4 pb-4 border-t border-border">
          <Button variant="ghost" className="justify-start" asChild>
            <Link to="/monthly-budget" onClick={() => setIsOpen(false)}>Monthly Budget</Link>
          </Button>
          <Button variant="ghost" className="justify-start" asChild>
            <Link to="/daily-expenses" onClick={() => setIsOpen(false)}>Daily Expenses</Link>
          </Button>
          <Button variant="ghost" className="justify-start" asChild>
            <Link to="/dashboard" onClick={() => setIsOpen(false)}>Dashboard</Link>
          </Button>
          <Button variant="ghost" className="justify-start" asChild>
            <Link to="/admin-tools" onClick={() => setIsOpen(false)}>Admin Tools</Link>
          </Button>
          <Button variant="ghost" className="justify-start" asChild>
            <Link to="/admin-login" onClick={() => setIsOpen(false)}>Admin</Link>
          </Button>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
