import React, { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { ref, onValue, update } from "firebase/database";
import db from "../firebase";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Badge } from "./ui/badge";

const NotificationMenu = ({ userId = "global" }) => {
  const [notifications, setNotifications] = useState([]);

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
    <DropdownMenu onOpenChange={(open) => open && markAsRead()}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            No notifications
          </div>
        ) : (
          <div className="max-h-72 overflow-y-auto">
            {notifications.map((n) => (
              <DropdownMenuItem
                key={n.id}
                className={`p-3 ${
                  n.read ? "text-muted-foreground" : "font-medium"
                }`}
              >
                {n.message}
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationMenu;
