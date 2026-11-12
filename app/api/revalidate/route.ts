import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { parseBody } from "next-sanity/webhook";
import { env } from "@/lib/env";
import { isContentType } from "@/sanity/types";

/**
 * Sanity publish webhook → on-demand revalidation (F-10).
 *
 * Sanity signs each request with the shared secret; the signature is checked
 * before anything else. The document's `_type` is the cache tag, so publishing
 * a project refreshes every page that reads projects, and nothing else.
 *
 * Webhook setup (sanity.io/manage → API → Webhooks):
 *   URL         https://<site>/api/revalidate
 *   Trigger on  Create, Update, Delete
 *   Projection  {_type}
 *   Secret      the value of SANITY_REVALIDATE_SECRET
 */

interface WebhookPayload {
  _type?: unknown;
}

const json = (body: Record<string, unknown>, status: number) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: NextRequest) {
  const secret = env.SANITY_REVALIDATE_SECRET;
  if (!secret) {
    // Misconfiguration on our side: fail closed and say so in the server log only.
    console.error("[revalidate] SANITY_REVALIDATE_SECRET is not set; rejecting webhook.");
    return json({ revalidated: false, message: "Revalidation is not configured." }, 500);
  }

  let parsed: Awaited<ReturnType<typeof parseBody<WebhookPayload>>>;
  try {
    // `true` waits for the Content Lake to settle, so the next fetch sees the change.
    parsed = await parseBody<WebhookPayload>(request, secret, true);
  } catch (error) {
    console.warn("[revalidate] Could not read the webhook body.", error);
    return json({ revalidated: false, message: "Malformed request body." }, 400);
  }

  if (parsed.isValidSignature !== true) {
    return json({ revalidated: false, message: "Invalid signature." }, 401);
  }

  const type = parsed.body?._type;
  if (!isContentType(type)) {
    return json(
      { revalidated: false, message: "Unknown or missing document type." },
      400,
    );
  }

  try {
    // expire: 0 → the very next request renders fresh content, so an edit is
    // visible on the first reload instead of the second.
    revalidateTag(type, { expire: 0 });
  } catch (error) {
    console.error(`[revalidate] Failed to revalidate "${type}".`, error);
    return json({ revalidated: false, message: "Revalidation failed." }, 500);
  }

  console.info(`[revalidate] Tag "${type}" expired.`);
  return json({ revalidated: true, tag: type }, 200);
}
