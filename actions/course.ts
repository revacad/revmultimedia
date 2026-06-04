"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaffAdmin } from "@/lib/auth/admin";
import { invalidateCourse } from "@/lib/redis/invalidate";
import { courseSchema, coursePublishSchema } from "@/lib/validations/course";
import { uuidIdSchema } from "@/lib/validations/common";
import { generateSlug } from "@/lib/utils";
import { sanitizeCourseContent } from "@/lib/security/sanitize-html";
import { safeActionFailure } from "@/lib/errors/action";

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

export async function createCourse(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireStaffAdmin();

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
    const draftCourseId = String(formData.get("course_draft_id") ?? "").trim();
    const instructorFields = parseInstructorFields(formData);

    const { data, error } = await supabase
      .from("courses")
      .insert({
        ...parsed.data,
        curriculum: parseCurriculumHtml(formData.get("curriculum_html")),
        thumbnail_r2_key: thumbnailKey,
        ...instructorFields,
      })
      .select("id, slug")
      .single();

    if (error) {
      return safeActionFailure("course.create", error, "Failed to create course.");
    }

    if (
      draftCourseId &&
      instructorFields.instructor_photo_r2_key?.includes(`courses/${draftCourseId}/`)
    ) {
      const { finalizeCourseInstructorPhotoKey } = await import("@/lib/r2/copy-object");
      const finalizedKey = await finalizeCourseInstructorPhotoKey(
        instructorFields.instructor_photo_r2_key,
        draftCourseId,
        data.id,
      );
      if (finalizedKey && finalizedKey !== instructorFields.instructor_photo_r2_key) {
        await supabase
          .from("courses")
          .update({ instructor_photo_r2_key: finalizedKey })
          .eq("id", data.id);
      }
    }

    invalidateCourse(data.slug);
    revalidatePath("/courses");
    revalidatePath("/admin/courses");

    return { success: true, data: { id: data.id } };
  } catch (e) {
    return safeActionFailure("course.create", e, "Failed to create course.");
  }
}

export async function updateCourse(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireStaffAdmin();

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
    const instructorFields = parseInstructorFields(formData);

    const { data, error } = await supabase
      .from("courses")
      .update({
        ...parsed.data,
        curriculum: parseCurriculumHtml(formData.get("curriculum_html")),
        thumbnail_r2_key: thumbnailKey,
        ...instructorFields,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("slug")
      .single();

    if (error) {
      return safeActionFailure("course.update", error, "Failed to update course.");
    }

    invalidateCourse(data.slug);
    revalidatePath("/courses");
    revalidatePath(`/courses/${data.slug}`);
    revalidatePath("/admin/courses");
    revalidatePath(`/admin/courses/${id}`);

    return { success: true };
  } catch (e) {
    return safeActionFailure("course.update", e, "Failed to update course.");
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

    await requireStaffAdmin();

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("courses")
      .update({ is_published: parsed.data.publish, updated_at: new Date().toISOString() })
      .eq("id", parsed.data.id)
      .select("slug")
      .single();

    if (error) {
      return safeActionFailure("course.togglePublish", error, "Failed to update publish status.");
    }

    invalidateCourse(data.slug);
    revalidatePath("/courses");
    revalidatePath(`/courses/${data.slug}`);
    revalidatePath("/admin/courses");

    return { success: true };
  } catch (e) {
    return safeActionFailure("course.togglePublish", e, "Failed to update publish status.");
  }
}

function parseCurriculumHtml(value: FormDataEntryValue | null): unknown {
  const html = sanitizeCourseContent(String(value ?? ""));
  if (!html) {
    return null;
  }
  return { html, version: 1 };
}

function parseInstructorFields(formData: FormData) {
  const name = String(formData.get("instructor_name") ?? "").trim() || null;
  const title = String(formData.get("instructor_title") ?? "").trim() || null;
  const bio = String(formData.get("instructor_bio") ?? "").trim() || null;
  const photoKey =
    String(formData.get("instructor_photo_r2_key") ?? "").trim() || null;
  return {
    instructor_name: name,
    instructor_title: title,
    instructor_bio: bio,
    instructor_photo_r2_key: photoKey,
  };
}

function parseDescription(value: FormDataEntryValue | null | undefined): string | undefined {
  const raw = String(value ?? "").trim();
  if (!raw) return undefined;
  if (/<[a-z][\s\S]*>/i.test(raw)) {
    const clean = sanitizeCourseContent(raw);
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

    await requireStaffAdmin();

    const supabase = createAdminClient();
    const { data: course } = await supabase
      .from("courses")
      .select("slug")
      .eq("id", parsed.data.id)
      .single();

    const { error } = await supabase.from("courses").delete().eq("id", parsed.data.id);

    if (error) {
      return safeActionFailure("course.delete", error, "Failed to delete course.");
    }

    if (course?.slug) {
      invalidateCourse(course.slug);
    }
    revalidatePath("/courses");
    revalidatePath("/admin/courses");

    return { success: true };
  } catch (e) {
    return safeActionFailure("course.delete", e, "Failed to delete course.");
  }
}
