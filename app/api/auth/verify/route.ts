import { getUserByVerifyToken, updateUser } from "@/lib/data/users";
import { absoluteUrl } from "@/lib/utils";
import { apiHandler } from "@/lib/http";

export const GET = apiHandler(async (request: Request) => {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) return Response.redirect(absoluteUrl("/account?verified=missing"), 302);

  const user = getUserByVerifyToken(token);
  if (!user) return Response.redirect(absoluteUrl("/account?verified=invalid"), 302);

  updateUser(user.id, { emailVerified: 1, verifyToken: null });

  return Response.redirect(absoluteUrl("/account?verified=1"), 302);
});
