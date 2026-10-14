"use client";

import { useEffect, useRef, useState } from "react";
import { useNotifications } from "@/lib/hooks";

interface NotificationBellProps {
  userEmail: string;
}

export function NotificationBell({ userEmail }: NotificationBellProps) {
  const { notifications, unreadCount, markRead, markAllRead } =
    useNotifications(userEmail);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((p) => !p)}
        style={{
          background: "rgba(255,255,255,.07)",
          border: "1px solid rgba(255,255,255,.12)",
          borderRadius: 10,
          padding: "8px 12px",
          color: "#fff",
          cursor: "pointer",
          fontSize: "1rem",
          position: "relative",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: -6,
              right: -6,
              background: "#ef4444",
              color: "#fff",
              fontSize: ".6rem",
              fontWeight: 700,
              borderRadius: 10,
              padding: "2px 6px",
              minWidth: 18,
              textAlign: "center",
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            width: 360,
            maxHeight: 480,
            overflowY: "auto",
            background: "#101d15",
            border: "1px solid rgba(255,255,255,.12)",
            borderRadius: 12,
            padding: 12,
            zIndex: 500,
            boxShadow: "0 20px 50px rgba(0,0,0,.6)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <b style={{ fontSize: ".85rem", color: "#fff" }}>Notifications</b>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  background: "none",
                  border: "none",
                  color: "#a3e635",
                  fontSize: ".72rem",
                  cursor: "pointer",
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 && (
            <p style={{ color: "rgba(255,255,255,.5)", fontSize: ".78rem" }}>
              No notifications yet.
            </p>
          )}

          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => markRead(n.id)}
              style={{
                padding: 10,
                borderRadius: 8,
                background: n.read ? "rgba(255,255,255,.03)" : "rgba(163,230,53,.08)",
                marginBottom: 6,
                cursor: "pointer",
                borderLeft: n.read
                  ? "3px solid transparent"
                  : "3px solid #a3e635",
              }}
            >
              <div
                style={{
                  fontSize: ".8rem",
                  fontWeight: 600,
                  color: "#fff",
                }}
              >
                {n.title}
              </div>
              <div
                style={{
                  fontSize: ".72rem",
                  color: "rgba(255,255,255,.6)",
                  marginTop: 2,
                }}
              >
                {n.message}
              </div>
              <div
                style={{
                  fontSize: ".65rem",
                  color: "rgba(255,255,255,.4)",
                  marginTop: 4,
                }}
              >
                {new Date(n.created_at).toLocaleString("en-KE", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}