"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearSession, getUser } from "@/lib/api";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/map", label: "Map" },
  { href: "/wells", label: "Wells" },
  { href: "/documents", label: "Documents" },
  { href: "/knowledge", label: "Knowledge" },
  { href: "/correlation", label: "Correlation" },
  { href: "/risk", label: "Risk" },
  { href: "/alerts", label: "Alerts" },
  { href: "/reports", label: "Reports" },
  { href: "/settings", label: "Settings" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<ReturnType<typeof getUser>>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const u = getUser();
    if (!u) router.replace("/login");
    else setUser(u);
  }, [router]);

  useEffect(() => {
    const onToast = (e: Event) => setToast((e as CustomEvent).detail);
    window.addEventListener("nwis-toast", onToast as EventListener);
    return () => window.removeEventListener("nwis-toast", onToast as EventListener);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  if (!user) return <div className="p-8 text-slate-400">Loading session…</div>;

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 shrink-0 bg-navy-900 border-r border-navy-700 flex flex-col">
        <div className="px-4 py-4 border-b border-navy-700">
          <div className="text-xs uppercase tracking-widest text-accent-400">SIH 26121</div>
          <div className="font-semibold">eRTMAC-NWIS</div>
          <div className="text-[11px] text-amber-400 mt-1">DEMO · synthetic data</div>
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`block rounded px-3 py-2 text-sm ${
                path === n.href || path.startsWith(n.href + "/")
                  ? "bg-navy-700 text-white"
                  : "text-slate-300 hover:bg-navy-800"
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-navy-700 text-xs text-slate-400">
          <div>{user.full_name}</div>
          <div className="capitalize">{user.role.replace("_", " ")}</div>
          <button
            className="mt-2 text-accent-400 hover:underline"
            onClick={() => {
              clearSession();
              router.push("/login");
            }}
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <div className="bg-amber-950/70 text-amber-200 text-xs px-4 py-1.5 border-b border-amber-900">
          Prototype decision support only. Simulated telemetry and fictional wells. Not OIL operational data.
          Does not control drilling equipment.
        </div>
        <div className="p-5">{children}</div>
      </main>
      {toast && (
        <div className="fixed bottom-4 right-4 bg-navy-800 border border-accent-600 text-sm px-4 py-2 rounded shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

export function toast(msg: string) {
  window.dispatchEvent(new CustomEvent("nwis-toast", { detail: msg }));
}

export function Card({ title, children, action }: { title?: React.ReactNode; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="bg-navy-900 border border-navy-700 rounded-lg p-4">
      {(title || action) && (
        <div className="flex items-center justify-between mb-3">
          {title && (typeof title === "string" ? <h2 className="text-sm font-semibold text-slate-200">{title}</h2> : title)}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Button({
  children,
  onClick,
  variant = "primary",
  className = "",
  disabled = false,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}) {
  const base = "px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";
  const styles = {
    primary: "bg-teal-600 hover:bg-teal-500 text-white shadow-md shadow-teal-900/20",
    secondary: "bg-navy-800 hover:bg-navy-700 text-slate-200 border border-navy-700",
    danger: "bg-rose-700 hover:bg-rose-600 text-white",
    ghost: "text-slate-300 hover:text-white hover:bg-navy-800",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${styles[variant]} ${className}`}>
      {children}
    </button>
  );
}

export function Badge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`inline-block text-[11px] px-2 py-0.5 rounded ${className}`}>{children}</span>;
}

export function Skeleton({ className = "h-24" }: { className?: string }) {
  return <div className={`animate-pulse bg-navy-800 rounded ${className}`} />;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="text-sm text-slate-400 py-8 text-center">{children}</div>;
}

export function ErrorBox({ error }: { error: unknown }) {
  return (
    <div className="border border-red-800 bg-red-950/40 text-red-200 text-sm p-3 rounded">
      {error instanceof Error ? error.message : "Request failed"}
    </div>
  );
}
