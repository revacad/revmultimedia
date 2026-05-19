"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/admin";
import { invalidateCourse, invalidateIntakes } from "@/lib/redis/invalidate";
import { intakeSchema } from "@/lib/validations/course";

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

export async function createIntake(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();

    const raw = {
      course_id: String(formData.get("course_id") ?? ""),
      name: String(formData.get("name") ?? ""),
      start_date: String(formData.get("start_date") ?? ""),
      end_date: String(formData.get("end_date") ?? ""),
      application_deadline:
        String(formData.get("application_deadline") ?? "") || undefined,
      max_slots: formData.get("max_slots")
        ? Number(formData.get("max_slots"))
        : undefined,
    };

    const parsed = intakeSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("intakes")
      .insert(parsed.data)
      .select("id, course_id")
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    const courseSlug = await getCourseSlug(data.course_id);
    if (courseSlug) {
      invalidateCourse(courseSlug);
    }
    invalidateIntakes(data.course_id);
    revalidatePath("/admin/intakes");
    revalidatePath("/courses");

    return { success: true, data: { id: data.id } };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to create intake",
    };
  }
}

export async function updateIntake(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const raw = {
      course_id: String(formData.get("course_id") ?? ""),
      name: String(formData.get("name") ?? ""),
      start_date: String(formData.get("start_date") ?? ""),
      end_date: String(formData.get("end_date") ?? ""),
      application_deadline:
        String(formData.get("application_deadline") ?? "") || undefined,
      max_slots: formData.get("max_slots")
        ? Number(formData.get("max_slots"))
        : undefined,
    };

    const parsed = intakeSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("intakes")
      .update(parsed.data)
      .eq("id", id)
      .select("course_id")
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    const courseSlug = await getCourseSlug(data.course_id);
    if (courseSlug) {
      invalidateCourse(courseSlug);
    }
    invalidateIntakes(data.course_id);
    revalidatePath("/admin/intakes");
    revalidatePath(`/admin/intakes/${id}`);
    revalidatePath("/courses");

    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to update intake",
    };
  }
}

export async function closeIntake(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("intakes")
      .update({ is_closed: true })
      .eq("id", id)
      .select("course_id")
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    const courseSlug = await getCourseSlug(data.course_id);
    if (courseSlug) {
      invalidateCourse(courseSlug);
    }
    invalidateIntakes(data.course_id);
    revalidatePath("/admin/intakes");
    revalidatePath("/courses");

    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to close intake",
    };
  }
}

export async function markSessionComplete(id: string): Promise<ActionResult> {
  return closeIntake(id);
}

async function getCourseSlug(courseId: string): Promise<string | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("courses")
    .select("slug")
    .eq("id", courseId)
    .maybeSingle();
  return data?.slug ?? null;
}
