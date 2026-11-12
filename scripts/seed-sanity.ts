#!/usr/bin/env node
/**
 * Import the seed dataset into Sanity.
 *
 *   pnpm seed                 create documents that do not exist yet
 *   pnpm seed --overwrite     replace existing documents with the seed version
 *   pnpm seed --dry-run       print what would be written, change nothing
 *
 * By default nothing that already exists is touched, so running it again never
 * discards edits made in the Studio. Requires NEXT_PUBLIC_SANITY_PROJECT_ID and
 * SANITY_WRITE_TOKEN (an Editor token) in .env.local.
 */
import { createClient } from "@sanity/client";
import { seedDocuments, type SeedDocument } from "../sanity/seed/data.ts";

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const overwrite = args.has("--overwrite");

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim();
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() || "production";
const token = process.env.SANITY_WRITE_TOKEN?.trim();

function fail(message: string): never {
  console.error(`[seed] ${message}`);
  process.exit(1);
}

/** Drop `undefined` values (optional translations) so the payload is plain JSON. */
const documents = JSON.parse(JSON.stringify(seedDocuments)) as SeedDocument[];

const counts = new Map<string, number>();
for (const document of documents) {
  counts.set(document._type, (counts.get(document._type) ?? 0) + 1);
}
const summary = [...counts].map(([type, count]) => `${count} ${type}`).join(", ");

if (dryRun) {
  console.info(`[seed] Dry run. Would write ${documents.length} documents: ${summary}`);
  for (const document of documents)
    console.info(`  ${document._type.padEnd(14)} ${document._id}`);
  process.exit(0);
}

if (!projectId) fail("NEXT_PUBLIC_SANITY_PROJECT_ID is not set. Add it to .env.local.");
if (!token) {
  fail(
    "SANITY_WRITE_TOKEN is not set. Create an Editor token at sanity.io/manage → API → Tokens and add it to .env.local.",
  );
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: "2026-11-01",
  useCdn: false,
});

try {
  // One transaction: either every document is written or none is.
  const transaction = client.transaction();
  for (const document of documents) {
    if (overwrite) transaction.createOrReplace(document);
    else transaction.createIfNotExists(document);
  }
  const result = await transaction.commit();
  console.info(
    `[seed] ${overwrite ? "Replaced" : "Created (where missing)"} ${result.results.length} documents in ` +
      `${projectId}/${dataset}: ${summary}`,
  );
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  fail(
    `Sanity rejected the import: ${message}\n` +
      "       Check that the token has write access and the dataset exists.",
  );
}
