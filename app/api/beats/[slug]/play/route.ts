import { incrementPlays } from "@/lib/data/catalog";
import { apiHandler, jsonOk } from "@/lib/http";

type Params = { params: Promise<{ slug: string }> };

/** Counts a preview play (fire-and-forget from the audio player). */
export const POST = apiHandler(async (_request: Request, { params }: Params) => {
  const { slug } = await params;
  try {
    incrementPlays(slug);
  } catch {
    /* beat removed — nothing to count */
  }
  return jsonOk({ counted: true });
});
