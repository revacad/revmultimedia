"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaffAdmin } from "@/lib/auth/admin";
import { invalidateCourse, invalidateIntakes } from "@/lib/redis/invalidate";
import {
  createIntakesForCoursesSchema,
  intakeInputSchema,
  intakeSchema,
} from "@/lib/validations/course";
import { uuidIdSchema } from "@/lib/validations/common";
import { safeActionFailure } from "@/lib/errors/action";
import type { z } from "zod";

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

export type IntakeInput = z.infer<typeof intakeInputSchema>;

async function invalidateCoursesByIds(courseIds: string[]): Promise<void> {
  const unique = [...new Set(courseIds)];
  await Promise.all(
    unique.map(async (courseId) => {
      const courseSlug = await getCourseSlug(courseId);
      if (courseSlug) {
        invalidateCourse(courseSlug);
      }
      invalidateIntakes(courseId);
    }),
  );
}

export async function createIntakesForCourses(
  courseIds: string[],
  intake: IntakeInput,
): Promise<ActionResult<{ count: number }>> {
  try {
    await requireStaffAdmin();

    const parsed = createIntakesForCoursesSchema.safeParse({ courseIds, intake });
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid input",
      };
    }

    const supabase = createAdminClient();
    const rows = parsed.data.courseIds.map((course_id) => ({
      ...parsed.data.intake,
      course_id,
    }));

    const { data, error } = await supabase
      .from("intakes")
      .insert(rows)
      .select("id, course_id");

    if (error) {
      return safeActionFailure("intake.createForCourses", error, "Failed to create intakes.");
    }

    await invalidateCoursesByIds(parsed.data.courseIds);
    revalidatePath("/admin/intakes");
    revalidatePath("/courses");

    return { success: true, data: { count: data?.length ?? rows.length } };
  } catch (e) {
    return safeActionFailure("intake.createForCourses", e, "Failed to create intakes.");
  }
}

export async function createIntakeForAllCourses(
  intake: IntakeInput,
): Promise<ActionResult<{ count: number }>> {
  try {
    await requireStaffAdmin();

    const parsedIntake = intakeInputSchema.safeParse(intake);
    if (!parsedIntake.success) {
      return {
        success: false,
        error: parsedIntake.error.issues[0]?.message ?? "Invalid intake details",
      };
    }

    const supabase = createAdminClient();
    const { data: courses, error: coursesError } = await supabase
      .from("courses")
      .select("id")
      .order("title");

    if (coursesError) {
      return safeActionFailure("intake.createForAllCourses", coursesError, "Failed to load courses.");
    }

    const courseIds = (courses ?? []).map((row) => row.id);
    if (courseIds.length === 0) {
      return { success: false, error: "No courses found to create intakes for." };
    }

    return createIntakesForCourses(courseIds, parsedIntake.data);
  } catch (e) {
    return safeActionFailure("intake.createForAllCourses", e, "Failed to create intakes.");
  }
}

export async function createIntake(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireStaffAdmin();

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
      return safeActionFailure("intake.create", error, "Failed to create intake.");
    }

    await invalidateCoursesByIds([data.course_id]);
    revalidatePath("/admin/intakes");
    revalidatePath("/courses");

    return { success: true, data: { id: data.id } };
  } catch (e) {
    return safeActionFailure("intake.create", e, "Failed to create intake.");
  }
}

export async function updateIntake(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireStaffAdmin();

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
      return safeActionFailure("intake.update", error, "Failed to update intake.");
    }

    await invalidateCoursesByIds([data.course_id]);
    revalidatePath("/admin/intakes");
    revalidatePath(`/admin/intakes/${id}`);
    revalidatePath("/courses");

    return { success: true };
  } catch (e) {
    return safeActionFailure("intake.update", e, "Failed to update intake.");
  }
}

export async function closeIntake(id: string): Promise<ActionResult> {
  try {
    const parsed = uuidIdSchema.safeParse({ id });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid intake id" };
    }

    await requireStaffAdmin();

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("intakes")
      .update({ is_closed: true })
      .eq("id", parsed.data.id)
      .select("course_id")
      .single();

    if (error) {
      return safeActionFailure("intake.close", error, "Failed to close intake.");
    }

    await invalidateCoursesByIds([data.course_id]);
    revalidatePath("/admin/intakes");
    revalidatePath("/courses");

    return { success: true };
  } catch (e) {
    return safeActionFailure("intake.close", e, "Failed to close intake.");
  }
}

export async function markSessionComplete(id: string): Promise<ActionResult> {
  return closeIntake(id);
}

export async function deleteIntake(intakeId: string): Promise<ActionResult> {
  try {
    const parsed = uuidIdSchema.safeParse({ id: intakeId });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid intake id" };
    }

    await requireStaffAdmin();

    const supabase = createAdminClient();

    const { count, error: countError } = await supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .eq("intake_id", parsed.data.id);

    if (countError) {
      return safeActionFailure("intake.delete", countError, "Failed to delete intake.");
    }

    const applicationCount = count ?? 0;
    if (applicationCount > 0) {
      return {
        success: false,
        error: `This intake has ${applicationCount} application(s) linked to it and cannot be deleted. Close or reassign those applications first.`,
      };
    }

    const { data, error } = await supabase
      .from("intakes")
      .delete()
      .eq("id", parsed.data.id)
      .select("course_id")
      .maybeSingle();

    if (error) {
      return safeActionFailure("intake.delete", error, "Failed to delete intake.");
    }

    if (!data) {
      return { success: false, error: "Intake not found." };
    }

    await invalidateCoursesByIds([data.course_id]);
    revalidatePath("/admin/intakes");
    revalidatePath("/courses");

    return { success: true };
  } catch (e) {
    return safeActionFailure("intake.delete", e, "Failed to delete intake.");
  }
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
