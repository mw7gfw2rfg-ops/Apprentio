import { NextResponse, type NextRequest } from "next/server";
import { syncVacanciesFromFindAnApprenticeship } from "@/lib/vacancies/sync";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const maxPagesParam = request.nextUrl.searchParams.get("maxPages");
  const maxPages = maxPagesParam ? Number(maxPagesParam) : undefined;

  try {
    const summary = await syncVacanciesFromFindAnApprenticeship(maxPages);
    return NextResponse.json({ ok: true, ...summary });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
