"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin/courses", label: "Courses" },
  { href: "/admin/intakes", label: "Intakes" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 border-r border-white/8 bg-dark-3 min-h-screen p-6">
      <Link href="/admin/courses" className="block mb-8">
        <span className="font-display text-xl font-bold text-primary">Rev</span>
        <span className="font-display text-xl font-semibold text-white">
          {" "}
          Admin
        </span>
      </Link>
      <nav className="space-y-1">
        {links.map((link) => {
          const active =
            pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "block rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "border-l-2 border-primary bg-primary/10 text-white"
                  : "text-white/60 hover:bg-white/5 hover:text-white",
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      <Link
        href="/"
        className="mt-10 block text-sm text-white/45 hover:text-white"
      >
        ← Back to public site
      </Link>
    </aside>
  );
}
