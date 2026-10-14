"use client";

interface ToastProps {
  message: string;
  visible?: boolean;
}

export function Toast({ message, visible = true }: ToastProps) {
  if (!message) return null;
  return (
    <div
      id="toast"
      className={visible ? "show" : ""}
      style={{ display: "block" }}
    >
      {message}
    </div>
  );
}