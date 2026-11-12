import type { ComponentProps, ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { isExternalUrl } from "@/lib/content-utils";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "md" | "sm";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-mono uppercase tracking-(--tracking-label) transition-[background-color,color,border-color,transform] duration-(--dur-s) ease-light active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

const sizes: Record<ButtonSize, string> = {
  // 48px / 40px tall: comfortably above the 24px WCAG 2.2 target minimum.
  md: "min-h-12 px-6 text-step--1",
  sm: "min-h-10 px-4 text-step--1",
};

const variants: Record<ButtonVariant, string> = {
  // Ink on orange is 5.18:1. Ivory on orange would be 3.05:1 and fail AA.
  primary: "bg-orange-500 text-ink-900 hover:bg-heading hover:text-surface",
  secondary:
    "border border-line-strong text-heading hover:bg-heading hover:text-surface hover:border-heading",
  ghost: "text-heading underline-offset-4 hover:underline decoration-accent decoration-1",
};

export function buttonClassName(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
): string {
  return cn(base, sizes[size], variants[variant], className);
}

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
}

type ButtonLinkProps = CommonProps & {
  href: string;
  /** Set for file downloads such as the CV. */
  download?: boolean;
  "aria-label"?: string;
  /** Hook for analytics, e.g. `data-cv-link`. */
  [dataAttribute: `data-${string}`]: string | undefined;
};

/**
 * A link styled as a button. Internal paths go through the locale-aware Link;
 * external URLs, mailto links and downloads render a plain anchor.
 */
export function ButtonLink({
  href,
  download,
  variant,
  size,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  const classes = buttonClassName(variant, size, className);
  const external = isExternalUrl(href);

  if (external || download || href.startsWith("mailto:") || href.startsWith("#")) {
    return (
      <a
        href={href}
        className={classes}
        {...(download ? { download: true } : {})}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        {...rest}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes} {...rest}>
      {children}
    </Link>
  );
}

type ButtonProps = CommonProps & Omit<ComponentProps<"button">, "className" | "children">;

export function Button({
  variant,
  size,
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button type={type} className={buttonClassName(variant, size, className)} {...rest}>
      {children}
    </button>
  );
}
