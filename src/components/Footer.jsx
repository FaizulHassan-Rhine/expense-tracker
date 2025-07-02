// components/Footer.js
import React from "react";

function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 w-full bg-gray-900 text-white text-center py-2 sm:py-3 shadow-md z-50 text-xs sm:text-sm">
      <p className="text-sm">
        © {new Date().getFullYear()} Faizul Hassan Rhine. All rights reserved.
      </p>
    </footer>
  );
}

export default Footer;
