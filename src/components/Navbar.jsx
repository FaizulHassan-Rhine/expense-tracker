import { useState } from "react";
import { Link } from "react-router-dom";
import { FaBars, FaTimes } from "react-icons/fa";
import NotificationMenu from "./NotificationMenu";

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white text-gray-700 p-2 sm:p-4 shadow-md fixed top-0 w-full z-50">
      <div className="flex flex-row items-center justify-between container mx-auto px-2">
        <div className="flex-1 flex justify-center md:justify-start">
          <Link to="/" className="text-2xl font-extrabold text-orange-600">Expense Tracker</Link>
        </div>
        <div className="md:hidden flex-1 flex justify-end">
          <button onClick={() => setIsOpen(!isOpen)} className="ml-2">
            {isOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
          </button>
        </div>
        <div className="hidden md:flex flex-1 items-center gap-6 justify-end">
          <Link to="/monthly-budget" className="hover:underline">Monthly Budget</Link>
          <Link to="/daily-expenses" className="hover:underline">Daily Expenses</Link>
          <Link to="/dashboard" className="hover:underline">Dashboard</Link>
          <Link to="/admin-tools" className="hover:underline">Admin Tools</Link>
          <Link to="/admin-login" className="hover:underline">Admin</Link>
          <NotificationMenu />
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden flex flex-col gap-4 mt-4 px-2 sm:px-4">
          <Link to="/monthly-budget" onClick={() => setIsOpen(false)} className="hover:underline">Monthly Budget</Link>
          <Link to="/daily-expenses" onClick={() => setIsOpen(false)} className="hover:underline">Daily Expenses</Link>
          <Link to="/dashboard" onClick={() => setIsOpen(false)} className="hover:underline">Dashboard</Link>
          <Link to="/admin-tools" onClick={() => setIsOpen(false)} className="hover:underline">Admin Tools</Link>
          <Link to="/admin-login" onClick={() => setIsOpen(false)} className="hover:underline">Admin</Link>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
