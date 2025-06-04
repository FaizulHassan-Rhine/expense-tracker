import { useState } from "react";
import { Link } from "react-router-dom";
import { FaBars, FaTimes } from "react-icons/fa";
import NotificationMenu from "./NotificationMenu";

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white text-gray-700 p-4 shadow-md fixed top-0 w-full z-50">
      <div className="flex justify-between items-center container mx-auto">
        <Link to="/" className="text-2xl font-extrabold text-orange-600">Expense Tracker</Link>

        <div className="hidden md:flex items-center gap-6">
          <Link to="/monthly-budget" className="hover:underline">Monthly Budget</Link>
          <Link to="/daily-expenses" className="hover:underline">Daily Expenses</Link>
          <Link to="/dashboard" className="hover:underline">Dashboard</Link>
          <Link to="/admin-tools" className="hover:underline">Admin Tools</Link>
          <Link to="/admin-login" className="hover:underline">Admin</Link>
          <NotificationMenu />
        </div>

        <div className="md:hidden">
          <button onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden flex flex-col gap-4 mt-4 px-4">
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
