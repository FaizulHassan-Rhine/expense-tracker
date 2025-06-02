import { Link } from "react-router-dom";

const NavBar = () => (
  <nav className="bg-gray-800 text-white p-4 flex space-x-4">
    <Link to="/monthly-budget" className="hover:underline">
      Monthly Budget
    </Link>
    <Link to="/daily-expenses" className="hover:underline">
      Daily Expenses
    </Link>
    <Link to="/dashboard" className="hover:underline">
      Dashboard
    </Link>
  </nav>
);

export default NavBar;
