import React, { useEffect, useState } from "react";
import { FiBell } from "react-icons/fi";
import { ref, onValue, update } from "firebase/database";
import db from "../firebase";

const NotificationMenu = ({ userId = "global" }) => {
  const [notifications, setNotifications] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const notifRef = ref(db, `notifications/${userId}`);
    const unsub = onValue(notifRef, (snap) => {
      const data = snap.val() || {};
      const formatted = Object.entries(data).map(([id, val]) => ({
        id,
        ...val,
      }));
      setNotifications(formatted.sort((a, b) => b.timestamp - a.timestamp));
    });
    return () => unsub();
  }, [userId]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = async () => {
    const updates = {};
    notifications.forEach((n) => {
      if (!n.read) updates[`notifications/${userId}/${n.id}/read`] = true;
    });
    await update(ref(db), updates);
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          setDropdownOpen(!dropdownOpen);
          markAsRead();
        }}
        className="relative"
      >
        <FiBell size={22} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 rounded-full w-2.5 h-2.5"></span>
        )}
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white shadow-lg rounded p-2 text-sm z-50 max-h-72 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-gray-500">No notifications</p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-2 border-b ${
                  n.read ? "text-gray-500" : "text-black font-medium"
                }`}
              >
                {n.message}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationMenu;
