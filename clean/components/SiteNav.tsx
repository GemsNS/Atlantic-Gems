"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface NavLink {
  href: string;
  label: string;
}

export function SiteNav({ links }: { links: NavLink[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement | null>(null);
  const button = useRef<HTMLButtonElement | null>(null);

  // Close whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close on Escape and on taps outside the panel.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (panel.current?.contains(t) || button.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  const isCurrent = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <nav className="nav" aria-label="Primary">
        {links.map((l) => (
          <Link key={l.href} href={l.href} aria-current={isCurrent(l.href) ? "page" : undefined}>
            {l.label}
          </Link>
        ))}
        <Link href="/contact" className="btn btn-primary btn-small nav-cta">
          Enquire
        </Link>
      </nav>

      <button
        ref={button}
        type="button"
        className="nav-toggle"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="nav-toggle-bars" aria-hidden="true">
          <span />
          <span />
        </span>
        {open ? "Close" : "Menu"}
      </button>

      <div
        id="mobile-menu"
        ref={panel}
        className="nav-panel"
        hidden={!open}
        aria-label="Primary mobile"
        role="navigation"
      >
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            aria-current={isCurrent(l.href) ? "page" : undefined}
            onClick={() => setOpen(false)}
          >
            {l.label}
          </Link>
        ))}
        <Link href="/contact" className="btn btn-primary" onClick={() => setOpen(false)}>
          Enquire
        </Link>
      </div>
      <div className="nav-backdrop" hidden={!open} aria-hidden="true" />
    </>
  );
}
