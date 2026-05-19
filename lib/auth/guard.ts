import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/admin";

export async function requireAdminPage(): Promise<{
  userId: string;
  role: "admin" | "superadmin";
}> {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }
  return session;
}
