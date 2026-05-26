"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/admin";
import { invalidateCourse } from "@/lib/redis/invalidate";
import { courseSchema, coursePublishSchema } from "@/lib/validations/course";
import { uuidIdSchema } from "@/lib/validations/common";
import { generateSlug } from "@/lib/utils";
import { sanitizeRichHtml } from "@/lib/security/html";

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
      description: parseDescription(formData.get("description")),
      mode: String(formData.get("mode") ?? ""),
      tuition_fee_ghs: Number(formData.get("tuition_fee_ghs")),
      max_slots: Number(formData.get("max_slots")),
      is_published: formData.get("is_published") === "on",
      video_intro_url: String(formData.get("video_intro_url") ?? "").trim() || null,
    };

    const parsed = courseSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const supabase = createAdminClient();
    const thumbnailKey = String(formData.get("thumbnail_r2_key") ?? "").trim() || null;

    const { data, error } = await supabase
      .from("courses")
      .insert({
        ...parsed.data,
        curriculum: parseCurriculumHtml(formData.get("curriculum_html")),
        thumbnail_r2_key: thumbnailKey,
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
      description: parseDescription(formData.get("description")),
      mode: String(formData.get("mode") ?? ""),
      tuition_fee_ghs: Number(formData.get("tuition_fee_ghs")),
      max_slots: Number(formData.get("max_slots")),
      is_published: formData.get("is_published") === "on",
      video_intro_url: String(formData.get("video_intro_url") ?? "").trim() || null,
    };

    const parsed = courseSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const supabase = createAdminClient();
    const thumbnailKey = String(formData.get("thumbnail_r2_key") ?? "").trim() || null;

    const { data, error } = await supabase
      .from("courses")
      .update({
        ...parsed.data,
        curriculum: parseCurriculumHtml(formData.get("curriculum_html")),
        thumbnail_r2_key: thumbnailKey,
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
    const parsed = coursePublishSchema.safeParse({ id, publish });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid request" };
    }

    await requireAdmin();

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("courses")
      .update({ is_published: parsed.data.publish, updated_at: new Date().toISOString() })
      .eq("id", parsed.data.id)
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

function parseCurriculumHtml(value: FormDataEntryValue | null): unknown {
  const html = sanitizeRichHtml(String(value ?? ""));
  if (!html) {
    return null;
  }
  return { html, version: 1 };
}

function parseDescription(value: FormDataEntryValue | null | undefined): string | undefined {
  const raw = String(value ?? "").trim();
  if (!raw) return undefined;
  if (/<[a-z][\s\S]*>/i.test(raw)) {
    const clean = sanitizeRichHtml(raw);
    return clean || undefined;
  }
  return raw.slice(0, 5000);
}

export async function deleteCourse(id: string): Promise<ActionResult> {
  try {
    const parsed = uuidIdSchema.safeParse({ id });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid course id" };
    }

    await requireAdmin();

    const supabase = createAdminClient();
    const { data: course } = await supabase
      .from("courses")
      .select("slug")
      .eq("id", parsed.data.id)
      .single();

    const { error } = await supabase.from("courses").delete().eq("id", parsed.data.id);

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
