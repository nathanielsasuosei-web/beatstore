import { z } from "zod";
import { assertAdmin, unauthorized } from "@/lib/admin-routes";
import { jsonError, jsonOk, readJson } from "@/lib/http";
import { deleteUser, getUserById, updateUser } from "@/lib/data/users";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({
  action: z.enum(["set_role", "verify_email", "delete"]),
  role: z.enum(["artist", "admin"]).optional(),
});

export async function PATCH(request: Request, { params }: Params) {
  const admin = await assertAdmin();
  if (!admin) return unauthorized();
  const { id } = await params;

  const parsed = schema.safeParse(await readJson<unknown>(request));
  if (!parsed.success) return jsonError("Invalid action", 422);

  const user = getUserById(id);
  if (!user) return jsonError("User not found", 404);
  if (user.id === admin.id && parsed.data.action !== "verify_email") {
    return jsonError("You can't change your own role or delete your own account.", 400);
  }

  switch (parsed.data.action) {
    case "set_role":
      if (!parsed.data.role) return jsonError("Pick a role", 422);
      updateUser(id, { role: parsed.data.role });
      return jsonOk({ role: parsed.data.role });
    case "verify_email":
      updateUser(id, { emailVerified: 1, verifyToken: null });
      return jsonOk({ verified: true });
    case "delete":
      // Orders are kept for the books — the FK simply clears the link.
      deleteUser(id);
      return jsonOk({ deleted: true });
    default:
      return jsonError("Unsupported action", 422);
  }
}
