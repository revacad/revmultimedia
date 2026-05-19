import { createServerClient } from "@/lib/supabase/server";

export type AdminRole = "admin" | "superadmin";

export async function getAdminSession(): Promise<{
  userId: string;
  role: AdminRole;
} | null> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const role = user.app_metadata?.role as string | undefined;
  if (role !== "admin" && role !== "superadmin") {
    return null;
  }

  return { userId: user.id, role };
}

export async function requireAdmin(): Promise<{
  userId: string;
  role: AdminRole;
}> {
  const session = await getAdminSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}
