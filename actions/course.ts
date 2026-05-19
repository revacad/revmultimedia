"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/admin";
import { invalidateCourse } from "@/lib/redis/invalidate";
import { courseSchema } from "@/lib/validations/course";
import { generateSlug } from "@/lib/utils";

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

export async function createCourse(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();

    const raw = {
      title: String(formData.get("title") ?? ""),
      slug:
        String(formData.get("slug") ?? "") ||
        generateSlug(String(formData.get("title") ?? "")),
      category: String(formData.get("category") ?? ""),
      description: String(formData.get("description") ?? "") || undefined,
      mode: String(formData.get("mode") ?? ""),
      tuition_fee_ghs: Number(formData.get("tuition_fee_ghs")),
      max_slots: Number(formData.get("max_slots")),
      is_published: formData.get("is_published") === "on",
    };

    const parsed = courseSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("courses")
      .insert({
        ...parsed.data,
        curriculum: parseCurriculum(formData.get("curriculum")),
      })
      .select("id, slug")
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    invalidateCourse(data.slug);
    revalidatePath("/courses");
    revalidatePath("/admin/courses");

    return { success: true, data: { id: data.id } };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to create course",
    };
  }
}

export async function updateCourse(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const raw = {
      title: String(formData.get("title") ?? ""),
      slug: String(formData.get("slug") ?? ""),
      category: String(formData.get("category") ?? ""),
      description: String(formData.get("description") ?? "") || undefined,
      mode: String(formData.get("mode") ?? ""),
      tuition_fee_ghs: Number(formData.get("tuition_fee_ghs")),
      max_slots: Number(formData.get("max_slots")),
      is_published: formData.get("is_published") === "on",
    };

    const parsed = courseSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("courses")
      .update({
        ...parsed.data,
        curriculum: parseCurriculum(formData.get("curriculum")),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("slug")
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    invalidateCourse(data.slug);
    revalidatePath("/courses");
    revalidatePath(`/courses/${data.slug}`);
    revalidatePath("/admin/courses");
    revalidatePath(`/admin/courses/${id}`);

    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to update course",
    };
  }
}

export async function togglePublish(
  id: string,
  publish: boolean,
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("courses")
      .update({ is_published: publish, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("slug")
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    invalidateCourse(data.slug);
    revalidatePath("/courses");
    revalidatePath(`/courses/${data.slug}`);
    revalidatePath("/admin/courses");

    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to update publish status",
    };
  }
}

function parseCurriculum(value: FormDataEntryValue | null): unknown {
  const text = String(value ?? "").trim();
  if (!text) {
    return null;
  }
  return { outline: text };
}

export async function deleteCourse(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();

    const supabase = createAdminClient();
    const { data: course } = await supabase
      .from("courses")
      .select("slug")
      .eq("id", id)
      .single();

    const { error } = await supabase.from("courses").delete().eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    if (course?.slug) {
      invalidateCourse(course.slug);
    }
    revalidatePath("/courses");
    revalidatePath("/admin/courses");

    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to delete course",
    };
  }
}
