/** First focusable element on every page: jumps keyboard users past the nav. */
export function SkipLink({ label }: { label: string }) {
  return (
    <a
      href="#content"
      className="bg-heading text-surface type-label ease-light fixed top-3 left-3 z-[100] -translate-y-24 rounded-full px-5 py-3 transition-transform duration-(--dur-s) focus-visible:translate-y-0"
    >
      {label}
    </a>
  );
}
