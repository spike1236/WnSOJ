"use client";

import Container from "@/components/Container";
import { cn } from "@/lib/cn";
import type { UserDetail } from "@/lib/types";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

function IconMenu({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function IconChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" height="16" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
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
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!userOpen) return;

    function onClickOutside(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (!userMenuRef.current?.contains(target)) setUserOpen(false);
    }

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [userOpen]);

  const links = useMemo(
    () => [
      { href: "/home", label: "Home" },
      { href: "/dashboard", label: "Dashboard" },
      { href: "/problems", label: "Problems" },
      { href: "/jobs", label: "Jobs" },
      { href: "/submissions", label: "Submissions" },
      { href: "/faq", label: "FAQ" }
    ],
    []
  );

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/55 bg-[#f5f7fb]/80 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          <Link className="group inline-flex items-center gap-2 text-sm font-semibold tracking-tight text-slate-900" href="/home">
            <span className="inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm transition group-hover:scale-105">
              <img alt="WnSOJ" className="h-full w-full object-cover" src="/favicon.ico" />
            </span>
            <span className="hidden sm:inline">WnSOJ</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <Link
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium transition",
                  isActivePath(pathname, l.href)
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:bg-white/70 hover:text-slate-900"
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
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-white md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            type="button"
          >
            <IconMenu />
          </button>

          {user ? (
            <>
              {user.is_staff ? (
                <Link
                  className="hidden rounded-full border border-[#304765]/20 bg-[#eef3f8] px-3 py-1.5 text-xs font-semibold text-[#304765] hover:bg-[#e1e8f1] lg:inline-flex"
                  href="/add_problem"
                >
                  Add Problem
                </Link>
              ) : null}
              {user.is_business ? (
                <Link
                  className="hidden rounded-full border border-amber-500/30 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 lg:inline-flex"
                  href="/add_job"
                >
                  Post Job
                </Link>
              ) : null}
              <div className="relative" ref={userMenuRef}>
                <button
                  aria-expanded={userOpen}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                  onClick={() => setUserOpen((v) => !v)}
                  type="button"
                >
                  <img alt="" className="h-6 w-6 rounded-full border object-cover" src={user.icon64_url ?? "/img/favicon.svg"} />
                  <span className="hidden md:inline">{user.username}</span>
                  <IconChevronDown className="text-slate-500" />
                </button>
                {userOpen ? (
                  <div className="absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                    <div className="border-b bg-slate-50 px-4 py-3">
                      <div className="text-sm font-semibold text-slate-900">{user.username}</div>
                      <div className="truncate text-xs text-slate-600">{user.email || "No email"}</div>
                    </div>
                    <div className="grid gap-1 p-2 text-sm">
                      <Link
                        className="rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-50"
                        href={`/profile/${encodeURIComponent(user.username)}`}
                        onClick={() => setUserOpen(false)}
                      >
                        Profile
                      </Link>
                      <Link className="rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-50" href="/edit_profile" onClick={() => setUserOpen(false)}>
                        Edit Profile
                      </Link>
                      <Link
                        className="rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-50"
                        href={`/submissions?username=${encodeURIComponent(user.username)}`}
                        onClick={() => setUserOpen(false)}
                      >
                        My Submissions
                      </Link>
                      {user.is_business ? (
                        <Link className="rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-50" href="/add_job" onClick={() => setUserOpen(false)}>
                          Post a Job
                        </Link>
                      ) : null}
                      {user.is_staff ? (
                        <Link
                          className="rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-50"
                          href="/add_problem"
                          onClick={() => setUserOpen(false)}
                        >
                          Add Problem
                        </Link>
                      ) : null}
                      <a className="rounded-lg px-3 py-2 text-rose-700 hover:bg-rose-50" href="/logout" onClick={() => setUserOpen(false)}>
                        Logout
                      </a>
                    </div>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <Link className="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-white" href="/login">
                Login
              </Link>
              <Link className="rounded-full bg-[#304765] px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-[#25374e]" href="/register">
                Register
              </Link>
            </>
          )}
        </div>
      </Container>

      {mobileOpen ? (
        <div className="border-t border-white/50 bg-[#f5f7fb]/95 md:hidden">
          <Container className="py-3">
            <div className="grid gap-1">
              {links.map((l) => (
                <Link
                  className={cn(
                    "rounded-xl px-3 py-2 text-sm font-medium transition hover:bg-white",
                    isActivePath(pathname, l.href) ? "bg-white text-slate-900" : "text-slate-700"
                  )}
                  href={l.href}
                  key={l.href}
                  onClick={() => setMobileOpen(false)}
                >
                  {l.label}
                </Link>
              ))}
              <div className="mt-2 border-t border-slate-200 pt-2">
                {user ? (
                  <div className="grid gap-1">
                    <Link
                      className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-white"
                      href={`/profile/${encodeURIComponent(user.username)}`}
                      onClick={() => setMobileOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-white" href="/edit_profile" onClick={() => setMobileOpen(false)}>
                      Edit Profile
                    </Link>
                    {user.is_business ? (
                      <Link className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-white" href="/add_job" onClick={() => setMobileOpen(false)}>
                        Post a Job
                      </Link>
                    ) : null}
                    {user.is_staff ? (
                      <Link className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-white" href="/add_problem" onClick={() => setMobileOpen(false)}>
                        Add Problem
                      </Link>
                    ) : null}
                    <a className="rounded-xl px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50" href="/logout" onClick={() => setMobileOpen(false)}>
                      Logout
                    </a>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    <Link className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-white" href="/login" onClick={() => setMobileOpen(false)}>
                      Login
                    </Link>
                    <Link className="rounded-xl bg-[#304765] px-3 py-2 text-center text-sm font-medium text-white hover:bg-[#25374e]" href="/register" onClick={() => setMobileOpen(false)}>
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
