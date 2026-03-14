"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function TasksIcon({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 12h6" />
      <path d="M9 16h6" />
    </svg>
  );
}

function SitesIcon({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M9 22V12h6v10" />
      <path d="M8 6h.01" />
      <path d="M16 6h.01" />
      <path d="M8 10h.01" />
      <path d="M16 10h.01" />
      <path d="M8 14h.01" />
      <path d="M16 14h.01" />
    </svg>
  );
}

function StockIcon({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}

function MessagesIcon({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function OrdersIcon({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

const icons: Record<string, React.ComponentType<{ color: string }>> = {
  Tasks: TasksIcon,
  Sites: SitesIcon,
  Stock: StockIcon,
  Messages: MessagesIcon,
  Orders: OrdersIcon,
};

const navItems = {
  manager: [
    { href: "/dashboard", label: "Tasks" },
    { href: "/dashboard/properties", label: "Sites" },
    { href: "/dashboard/inventory", label: "Stock" },
    { href: "/dashboard/messages", label: "Messages" },
    { href: "/dashboard/orders", label: "Orders" },
  ],
  cleaner: [
    { href: "/dashboard", label: "Tasks" },
    { href: "/dashboard/messages", label: "Messages" },
  ],
  supplier: [
    { href: "/dashboard", label: "Tasks" },
    { href: "/dashboard/orders", label: "Orders" },
    { href: "/dashboard/messages", label: "Messages" },
  ],
};

const ACTIVE_COLOR = "#007AFF";
const INACTIVE_COLOR = "#8E8E93";

export function BottomNav({ role }: { role: string }) {
  const pathname = usePathname();
  const items = navItems[role as keyof typeof navItems] ?? navItems.cleaner;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 safe-bottom"
      style={{ pointerEvents: "none" }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          maxWidth: "380px",
          margin: "0 auto 12px",
          borderRadius: "28px",
          backgroundColor: "rgba(255, 255, 255, 0.72)",
          backdropFilter: "blur(40px) saturate(180%)",
          WebkitBackdropFilter: "blur(40px) saturate(180%)",
          boxShadow:
            "0 2px 20px rgba(0, 0, 0, 0.08), 0 0 0 0.5px rgba(0, 0, 0, 0.06), inset 0 0 0 0.5px rgba(255, 255, 255, 0.45)",
          padding: "6px 4px",
          pointerEvents: "auto",
        }}
      >
        {items.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          const color = isActive ? ACTIVE_COLOR : INACTIVE_COLOR;
          const Icon = icons[item.label];
          return (
            <Link
              key={item.href}
              href={item.href}
              className="touch-target"
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "2px",
                paddingTop: "6px",
                paddingBottom: "6px",
                borderRadius: "22px",
                position: "relative",
                color,
                textDecoration: "none",
                transition: "background-color 0.2s ease",
                backgroundColor: isActive
                  ? "rgba(0, 122, 255, 0.1)"
                  : "transparent",
              }}
            >
              <Icon color={color} />
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 500,
                  lineHeight: 1,
                  letterSpacing: "0.01em",
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
