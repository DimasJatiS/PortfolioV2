import { STORAGE_KEYS } from "@/lib/site";

/**
 * Applies the saved theme before first paint, so there is no flash of the wrong
 * mode. Order of precedence: the visitor's stored choice, then the operating
 * system's `prefers-color-scheme`, then Day.
 *
 * It runs before hydration and therefore cannot import anything; every access
 * is wrapped because storage can be blocked.
 */
const script = `(function(){var d=document.documentElement,t=null;try{t=localStorage.getItem(${JSON.stringify(
  STORAGE_KEYS.theme,
)})}catch(e){}if(t!=="day"&&t!=="night"){try{t=window.matchMedia("(prefers-color-scheme: dark)").matches?"night":"day"}catch(e){t="day"}}d.setAttribute("data-theme",t)})()`;

export function ThemeScript() {
  return (
    <script
      // Executable on the server-rendered document only. If React ever renders
      // this on the client it becomes inert text, which avoids React's warning
      // about scripts that would never run (Next.js "preventing flash" guide).
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: script }}
    />
  );
}
