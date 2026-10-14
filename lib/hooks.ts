"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";

// ────────────────────────────────────────────────────────────
// useToast — persistent across any component
// ────────────────────────────────────────────────────────────
export function useToast(duration = 3000) {
  const [toastMsg, setToastMsg] = useState("");

  const showToast = useCallback((m: string) => {
    setToastMsg(m);
    setTimeout(() => setToastMsg(""), duration);
  }, [duration]);

  return { toastMsg, showToast };
}

// ────────────────────────────────────────────────────────────
// useProfile — loads current user's profile + role
// ────────────────────────────────────────────────────────────
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: "chair" | "cochair" | "member" | "client" | "consultant" | "intern";
  is_approved: boolean;
  department?: string;
  phone?: string;
  client_org?: string;
}

export function useProfile() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }
      setUserEmail(session.user.email || "");
      setUserId(session.user.id);

      const { data: p } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      setProfile(p as Profile | null);
      setLoading(false);
    };
    load();
  }, []);

  const isApprover = ["chair", "cochair"].includes(profile?.role || "");
  const isClient = profile?.role === "client";
  const isApproved = !!profile?.is_approved;

  return { loading, profile, userEmail, userId, isApprover, isClient, isApproved };
}

// ────────────────────────────────────────────────────────────
// useNotifications — bell + panel state
// ────────────────────────────────────────────────────────────
export interface Notification {
  id: string;
  user_email: string;
  type: string;
  title: string;
  message: string | null;
  task_id: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

export function useNotifications(userEmail: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const reload = useCallback(async () => {
    if (!userEmail) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_email", userEmail)
      .order("created_at", { ascending: false })
      .limit(25);
    setNotifications((data as Notification[]) || []);
  }, [userEmail]);

  useEffect(() => {
    reload();
    if (!userEmail) return;

    const channel = supabase
      .channel("notifications-" + userEmail)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_email=eq.${userEmail}` },
        () => reload()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userEmail, reload]);

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllRead = async () => {
    if (!userEmail) return;
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_email", userEmail)
      .eq("read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, unreadCount, markRead, markAllRead, reload };
}

// ────────────────────────────────────────────────────────────
// useCountUp — animated number for KPI cards
// ────────────────────────────────────────────────────────────
export function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (target <= 0) { setValue(0); return; }
    const start = performance.now();
    let raf: number;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

// ────────────────────────────────────────────────────────────
// useScrolled — nav scroll detection
// ────────────────────────────────────────────────────────────
export function useScrolled(threshold = 40) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > threshold);
    window.addEventListener("scroll", h, { passive: true });
    h();
    return () => window.removeEventListener("scroll", h);
  }, [threshold]);
  return scrolled;
}

// ────────────────────────────────────────────────────────────
// useReveal — Intersection Observer for .reveal elements
// ────────────────────────────────────────────────────────────
export function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          io.unobserve(e.target);
        }
      }),
      { threshold: 0.15 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

// ────────────────────────────────────────────────────────────
// useTz — rotating timezone display
// ────────────────────────────────────────────────────────────
export const TIMEZONES = [
  { label: "EAT (Nairobi)", tz: "Africa/Nairobi" },
  { label: "GMT (London)", tz: "Europe/London" },
  { label: "EST (New York)", tz: "America/New_York" },
];

export function useRotatingTz(interval = 5000) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setIdx((p) => (p + 1) % TIMEZONES.length), interval);
    return () => clearInterval(i);
  }, [interval]);
  return TIMEZONES[idx];
}

export function fmtInTz(date: Date, tz: string) {
  try {
    return date.toLocaleTimeString("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return "---";
  }
}