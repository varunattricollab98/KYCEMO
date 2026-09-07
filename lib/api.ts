import { NextRequest, NextResponse } from "next/server";
import { loadUsableCase } from "@/lib/cases";
import type { KycCase } from "@/lib/types";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function badRequest(message: string) {
  return json({ error: message }, 400);
}

export function unauthorized(message = "Unauthorized") {
  return json({ error: message }, 401);
}

/**
 * Wrap a token-scoped route handler. Loads + validates the public KYC token
 * before running the handler, so no handler can act on an invalid/expired case.
 */
export function withCase(
  handler: (
    req: NextRequest,
    ctx: { kase: KycCase; token: string }
  ) => Promise<NextResponse>
) {
  return async (
    req: NextRequest,
    { params }: { params: { token: string } }
  ): Promise<NextResponse> => {
    const kase = await loadUsableCase(params.token);
    if (!kase) return json({ error: "Invalid or expired KYC link" }, 404);
    return handler(req, { kase, token: params.token });
  };
}

export function clientMeta(req: NextRequest) {
  return {
    ip:
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      undefined,
    user_agent: req.headers.get("user-agent") ?? undefined,
  };
}
