"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import type { CvLink } from "@/lib/content-utils";
import { NAV_ITEMS } from "@/lib/site";
import { cn } from "@/lib/utils";
import { AvailabilityBadge } from "./AvailabilityBadge";
import { ButtonLink } from "./Button";
import { LocaleToggle } from "./LocaleToggle";
import { Monogram } from "./Monogram";
import { ThemeToggle } from "./ThemeToggle";

interface NavProps {
  cv: CvLink | null;
  availabilityLabel: string | null;
}

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Global navigation: DJS mark, section links, EN/ID, Night, and a CV button that
 * is reachable from every page (F-03). Below the `lg` breakpoint the links move
 * into a full-screen overlay built on the native <dialog>, which provides the
 * focus trap, Escape to close and inert background without extra code.
 */
export function Nav({ cv, availabilityLabel }: NavProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Navigating closes the overlay. The dialog's own `close` event updates state.
  useEffect(() => {
    if (dialogRef.current?.open) dialogRef.current.close();
  }, [pathname]);

  // Lock page scroll behind the overlay.
  useEffect(() => {
    if (!menuOpen) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, [menuOpen]);

  const openMenu = () => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    try {
      dialog.showModal();
      setMenuOpen(true);
    } catch (error) {
      // showModal throws if the dialog is detached; the links remain in the footer.
      console.error("[nav] Could not open the menu.", error);
    }
  };

  const cvButton = (
    <ButtonLink
      href={cv?.href ?? "/resume"}
      download={cv?.local}
      variant="primary"
      size="sm"
      data-cv-link=""
    >
      {t("nav.cv")}
    </ButtonLink>
  );

  return (
    <header className="no-print fixed inset-x-0 top-0 z-50">
      <div className="bg-surface/75 border-line/60 border-b backdrop-blur-md">
        <div className="container-page flex h-(--nav-height) items-center justify-between gap-3">
          <Link
            href="/"
            aria-label={t("a11y.home")}
            className="text-heading -ml-1 flex items-center gap-2 rounded-full p-1 pr-3"
          >
            <Monogram />
            <span aria-hidden="true" className="type-label font-medium">
              DJS
            </span>
          </Link>

          <nav aria-label={t("a11y.mainNav")} className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "type-label hover:text-heading relative inline-flex min-h-10 items-center rounded-full px-3 transition-colors duration-(--dur-xs)",
                        active ? "text-heading" : "text-muted",
                      )}
                    >
                      {t(`nav.${item.key}`)}
                      {active && (
                        <span
                          aria-hidden="true"
                          className="absolute inset-x-3 bottom-1 h-px bg-orange-500"
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-1">
            <LocaleToggle />
            <ThemeToggle />
            <span className="ml-1">{cvButton}</span>
            <button
              type="button"
              onClick={openMenu}
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={t("a11y.openMenu")}
              className="text-heading hover:bg-heading/10 ml-1 inline-flex size-10 items-center justify-center rounded-full lg:hidden"
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="size-5">
                <path
                  d="M4 8h16M4 16h16"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <dialog
        ref={dialogRef}
        id="mobile-menu"
        aria-label={t("a11y.menu")}
        onClose={() => setMenuOpen(false)}
        className="surface-inverse m-0 hidden h-dvh max-h-none w-screen max-w-none overflow-y-auto overscroll-contain p-0 backdrop:bg-transparent open:block"
      >
        <div className="container-page flex min-h-full flex-col pb-10">
          <div className="flex h-(--nav-height) items-center justify-between">
            <span className="text-heading flex items-center gap-2">
              <Monogram />
              <span aria-hidden="true" className="type-label font-medium">
                DJS
              </span>
            </span>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label={t("a11y.closeMenu")}
              className="text-heading hover:bg-heading/10 inline-flex size-10 items-center justify-center rounded-full"
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="size-5">
                <path
                  d="m6 6 12 12M18 6 6 18"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          <nav aria-label={t("a11y.mainNav")} className="mt-10">
            <ul className="flex flex-col gap-2">
              {NAV_ITEMS.map((item, index) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className="group flex items-baseline gap-4 py-2"
                    >
                      <span className="type-label text-muted w-6">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span
                        className={cn(
                          "type-designer text-step-3 text-heading decoration-accent decoration-1 underline-offset-8 group-hover:underline",
                          active && "underline",
                        )}
                      >
                        {t(`nav.${item.key}`)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="mt-auto flex flex-col gap-6 pt-12">
            <AvailabilityBadge label={availabilityLabel} />
            <div className="flex items-center gap-2">{cvButton}</div>
          </div>
        </div>
      </dialog>
    </header>
  );
}
