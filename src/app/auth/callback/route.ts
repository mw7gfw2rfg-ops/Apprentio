import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const SAFE_DEFAULT_NEXT = "/dashboard";

// `next` arrives on a link an attacker can craft and send directly to a
// real user (this route is unauthenticated-reachable, listed in proxy.ts's
// PUBLIC_PATHS) -- allow-list it to a same-origin relative path rather than
// trusting it, or a real auth flow can be used to bounce the user to an
// off-site phishing page right after they've just legitimately signed in
// (OVERNIGHT_SECURITY_REVIEW.md #5). Reject protocol-relative "//evil.com"
// and the "/\evil.com" backslash variant some browsers still normalise to
// protocol-relative, not just bare absolute URLs.
function safeNext(rawNext: string | null): string {
  if (rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") && !rawNext.startsWith("/\\")) {
    return rawNext;
  }
  return SAFE_DEFAULT_NEXT;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Could not verify email`);
}
