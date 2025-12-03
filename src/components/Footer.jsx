// components/Footer.js
import React from "react";

function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 w-full bg-background border-t border-border text-foreground text-center py-3 sm:py-4 shadow-sm z-50">
      <p className="text-sm text-muted-foreground">
        © {new Date().getFullYear()} Faizul Hassan Rhine. All rights reserved.
      </p>
    </footer>
  );
}

export default Footer;
