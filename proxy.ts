import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

/** Locale routing: serves English at `/` and Bahasa Indonesia at `/id`. */
export default createMiddleware(routing);

export const config = {
  // Everything except API routes, Next.js internals and files with an extension.
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
