import { notFound } from "next/navigation";

/**
 * Catches every URL that no other route matches, so unknown paths render the
 * localised 404 page inside the normal layout instead of the framework default.
 */
export function generateStaticParams() {
  // Cache Components needs one sample to validate the route at build time.
  return [{ rest: ["not-found"] }];
}

export default function CatchAllPage() {
  notFound();
}
