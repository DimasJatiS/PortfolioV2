"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/dom/Button";

/**
 * Route-level error boundary. The nav, footer and background stay mounted, so a
 * failing page still leaves the visitor a way out. Server errors arrive with a
 * generic message and a `digest` that matches the server log.
 */
export default function ErrorPage({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  const t = useTranslations("error");

  useEffect(() => {
    console.error("[page] Rendering failed.", error);
  }, [error]);

  const digest =
    error instanceof Error && "digest" in error && typeof error.digest === "string"
      ? error.digest
      : null;

  return (
    <section className="container-page flex min-h-dvh flex-col items-start justify-center gap-6 py-32">
      <h1 className="type-statement text-step-4">{t("title")}</h1>
      <p className="text-muted max-w-[46ch]">{t("body")}</p>
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => retry()}>{t("retry")}</Button>
        <ButtonLink href="/" variant="secondary">
          {t("home")}
        </ButtonLink>
      </div>
      {digest && <p className="type-label text-muted">ref: {digest}</p>}
    </section>
  );
}
