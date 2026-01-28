"use client";

import Container from "@/components/Container";
import { cn } from "@/lib/cn";
import type { UserDetail } from "@/lib/types";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

function IconMenu({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4 6h16M4 12h16M4 18h16"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function IconChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" height="16" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/" || pathname === "/home";
  if (href === "/home") return pathname === "/home" || pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function SiteHeaderClient({ user }: { user: UserDetail | null }) {
  const pathname = usePathname() || "/";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const links = useMemo(
    () => [
      { href: "/home", label: "Home" },
      { href: "/problems", label: "Problems" },
      { href: "/jobs", label: "Jobs" },
      { href: "/faq", label: "FAQ" }
    ],
    []
  );

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b bg-white/80 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <Link className="text-sm font-semibold tracking-tight text-slate-900" href="/">
            WnSOJ
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <Link
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-100",
                  isActivePath(pathname, l.href) ? "bg-slate-100 text-slate-900" : "text-slate-700 hover:text-slate-900"
                )}
                href={l.href}
                key={l.href}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <button
            aria-label="Open menu"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border text-slate-700 hover:bg-slate-50 md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            type="button"
          >
            <IconMenu />
          </button>

          {user ? (
            <div className="relative">
              <button
                aria-expanded={userOpen}
                className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                onClick={() => setUserOpen((v) => !v)}
                type="button"
              >
                <img
                  alt=""
                  className="h-6 w-6 rounded-full border object-cover"
                  src={user.icon64_url ?? "/img/favicon.svg"}
                />
                <span className="hidden md:inline">{user.username}</span>
                <IconChevronDown className="text-slate-500" />
              </button>
              {userOpen ? (
                <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border bg-white shadow-lg">
                  <div className="border-b px-4 py-3">
                    <div className="text-sm font-semibold text-slate-900">{user.username}</div>
                    <div className="text-xs text-slate-600">{user.email}</div>
                  </div>
                  <div className="grid gap-1 p-2 text-sm">
                    <Link
                      className="rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-50"
                      href={`/profile/${encodeURIComponent(user.username)}`}
                      onClick={() => setUserOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      className="rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-50"
                      href="/edit_profile"
                      onClick={() => setUserOpen(false)}
                    >
                      Edit Profile
                    </Link>
                    <Link
                      className="rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-50"
                      href={`/submissions?username=${encodeURIComponent(user.username)}`}
                      onClick={() => setUserOpen(false)}
                    >
                      Submissions
                    </Link>
                    <a
                      className="rounded-lg px-3 py-2 text-rose-700 hover:bg-rose-50"
                      href="/logout"
                      onClick={() => setUserOpen(false)}
                    >
                      Logout
                    </a>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <>
              <Link className="rounded-lg border px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" href="/login">
                Login
              </Link>
              <Link
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                href="/register"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </Container>

      {mobileOpen ? (
        <div className="border-t bg-white md:hidden">
          <Container className="py-3">
            <div className="grid gap-1">
              {links.map((l) => (
                <Link
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-50",
                    isActivePath(pathname, l.href) ? "bg-slate-100 text-slate-900" : "text-slate-700"
                  )}
                  href={l.href}
                  key={l.href}
                  onClick={() => setMobileOpen(false)}
                >
                  {l.label}
                </Link>
              ))}
              <div className="mt-2 border-t pt-2">
                {user ? (
                  <div className="grid gap-1">
                    <Link
                      className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      href={`/profile/${encodeURIComponent(user.username)}`}
                      onClick={() => setMobileOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      href="/edit_profile"
                      onClick={() => setMobileOpen(false)}
                    >
                      Edit Profile
                    </Link>
                    <Link
                      className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      href={`/submissions?username=${encodeURIComponent(user.username)}`}
                      onClick={() => setMobileOpen(false)}
                    >
                      Submissions
                    </Link>
                    <a
                      className="rounded-lg px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50"
                      href="/logout"
                      onClick={() => setMobileOpen(false)}
                    >
                      Logout
                    </a>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    <Link
                      className="rounded-lg border px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                      href="/register"
                      onClick={() => setMobileOpen(false)}
                    >
                      Register
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </Container>
        </div>
      ) : null}
    </header>
  );
}

