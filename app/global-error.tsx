"use client";

import { useEffect } from "react";

/**
 * Last line of defence: replaces the root layout when the layout itself fails.
 * It cannot rely on the app's CSS, fonts or translations, so everything is
 * inline and the copy is bilingual.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error("[app] The root layout failed to render.", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: 24,
          background: "#FBF8F1",
          color: "#14201A",
          fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
        }}
      >
        <main style={{ maxWidth: 480 }}>
          <h1 style={{ fontSize: 32, lineHeight: 1.1, margin: 0, color: "#0B3D2C" }}>
            The light scattered
          </h1>
          <p style={{ lineHeight: 1.6 }}>
            Something went wrong while loading the site. Please try again.
            <br />
            <span lang="id">Ada yang salah saat memuat situs. Silakan coba lagi.</span>
          </p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              minHeight: 48,
              padding: "0 24px",
              border: 0,
              borderRadius: 999,
              background: "#E8692A",
              color: "#14201A",
              font: "inherit",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again · Coba lagi
          </button>
        </main>
      </body>
    </html>
  );
}
