import { cookies } from "next/headers";
import Link from "next/link";

import { stopImpersonation } from "@/app/actions";
import { getSessionCookieName, getSessionUser } from "@/lib/auth";

type WorkspaceNavProps = {
  currentPath: string;
};

type NavItem = {
  href: string;
  label: string;
};

const ADMIN_ITEMS: NavItem[] = [
  { href: "/", label: "Overview" },
  { href: "/jobs", label: "Jobs" },
  { href: "/payments", label: "Payments" },
  { href: "/invoices", label: "Invoices" },
  { href: "/reports", label: "Reports" },
  { href: "/reviews", label: "Reviews" },
  { href: "/users", label: "Users" },
];

const STAFF_ITEMS: NavItem[] = [
  { href: "/", label: "Overview" },
  { href: "/jobs", label: "Jobs" },
  { href: "/payments", label: "Payments" },
  { href: "/invoices", label: "Invoices" },
  { href: "/reports", label: "Reports" },
];

const CLEANER_ITEMS: NavItem[] = [{ href: "/my-jobs", label: "My jobs" }];

function isCurrentPath(currentPath: string, href: string) {
  if (href === "/") {
    return currentPath === "/";
  }

  return currentPath === href || currentPath.startsWith(`${href}/`);
}

export async function WorkspaceNav({ currentPath }: WorkspaceNavProps) {
  const cookieStore = await cookies();
  const sessionUser = await getSessionUser(cookieStore.get(getSessionCookieName())?.value);

  if (!sessionUser) {
    return null;
  }

  const navItems =
    sessionUser.role === "admin"
      ? ADMIN_ITEMS
      : sessionUser.role === "cleaner"
        ? CLEANER_ITEMS
        : STAFF_ITEMS;

  return (
    <nav className="rounded-[28px] border border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(245,250,246,0.92))] p-3 backdrop-blur">
      <div className="flex flex-col gap-3">
        {sessionUser.impersonation ? (
          <div className="flex flex-col gap-3 rounded-[22px] border border-[rgba(213,155,61,0.28)] bg-[rgba(255,248,231,0.9)] px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b5a12]">
                Impersonation mode
              </p>
              <p className="mt-1 text-sm text-[#6f4b18]">
                Viewing the app as <span className="font-semibold">{sessionUser.name}</span>.
                {" "}
                Return control to <span className="font-semibold">{sessionUser.impersonation.adminName}</span> when you are done.
              </p>
            </div>
            <form action={stopImpersonation}>
              <button className="rounded-full bg-[linear-gradient(135deg,#1f7a52_0%,#145238_100%)] px-4 py-2 text-sm font-medium text-white shadow-[0_10px_24px_rgba(20,82,56,0.22)] transition hover:opacity-95">
                Stop impersonating
              </button>
            </form>
          </div>
        ) : null}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              Workspace menu
            </p>
            <p className="mt-1 text-sm text-muted">
              Signed in as <span className="font-semibold text-ink-soft">{sessionUser.name}</span>
              {" · "}
              <span className="capitalize">{sessionUser.role}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {navItems.map((item) => {
              const active = isCurrentPath(currentPath, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-[linear-gradient(135deg,#1f7a52_0%,#145238_100%)] text-white shadow-[0_10px_24px_rgba(20,82,56,0.22)]"
                      : "border border-border bg-white/85 text-ink-soft hover:bg-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
