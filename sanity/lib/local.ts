import { evaluate, parse } from "groq-js";
import { seedDocuments } from "../seed/data";

/**
 * Run a GROQ query against the bundled seed dataset.
 *
 * This is what makes the site work before Sanity is connected and keeps it up
 * if Sanity is unreachable: the fallback goes through the very same queries as
 * production, so there is no second, hand-written code path to drift.
 */
export async function evaluateLocally(
  query: string,
  params: Record<string, unknown>,
): Promise<unknown> {
  const tree = parse(query, { params });
  const value = await evaluate(tree, { dataset: seedDocuments, params });
  return value.get();
}
