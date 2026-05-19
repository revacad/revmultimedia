import { createPublicClient } from "@/lib/supabase/public";
import { createAdminClient } from "@/lib/supabase/admin";
import { withCache } from "@/lib/redis/cache";
import type { Course, Intake } from "@/lib/courses/types";

function mapCourse(row: Record<string, unknown>): Course {
  const intakes = (row.intakes as Intake[] | null) ?? [];
  return {
    id: row.id as string,
    title: row.title as string,
    slug: row.slug as string,
    category: row.category as Course["category"],
    description: (row.description as string | null) ?? null,
    curriculum: row.curriculum ?? null,
    mode: row.mode as Course["mode"],
    tuition_fee_ghs: Number(row.tuition_fee_ghs),
    max_slots: row.max_slots as number,
    is_published: row.is_published as boolean,
    thumbnail_r2_key: (row.thumbnail_r2_key as string | null) ?? null,
    created_at: row.created_at as string | undefined,
    updated_at: row.updated_at as string | undefined,
    intakes: intakes
      .filter((i) => !i.is_closed)
      .sort(
        (a, b) =>
          new Date(a.start_date).getTime() - new Date(b.start_date).getTime(),
      ),
  };
}

const courseSelect = `
  id,
  title,
  slug,
  category,
  description,
  curriculum,
  mode,
  tuition_fee_ghs,
  max_slots,
  is_published,
  thumbnail_r2_key,
  created_at,
  updated_at,
  intakes (
    id,
    course_id,
    name,
    start_date,
    end_date,
    application_deadline,
    max_slots,
    enrolled_count,
    is_closed
  )
`;

export async function getFeaturedCoursesForHome(): Promise<Course[]> {
  return withCache("courses:featured:home", 300, async () => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("courses")
      .select(courseSelect)
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(3);

    if (error) {
      console.error("[courses] getFeaturedCoursesForHome failed", error);
      return [];
    }

    return (data ?? []).map((row) => mapCourse(row as Record<string, unknown>));
  });
}

export async function getPublishedCourses(): Promise<Course[]> {
  return withCache("courses:published", 300, async () => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("courses")
      .select(courseSelect)
      .eq("is_published", true)
      .order("title", { ascending: true });

    if (error) {
      console.error("[courses] getPublishedCourses failed", error);
      return [];
    }

    return (data ?? []).map((row) => mapCourse(row as Record<string, unknown>));
  });
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  return withCache(`course:${slug}`, 300, async () => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("courses")
      .select(courseSelect)
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();

    if (error || !data) {
      if (error) {
        console.error("[courses] getCourseBySlug failed", error);
      }
      return null;
    }

    return mapCourse(data as Record<string, unknown>);
  });
}

export async function getAllCoursesAdmin(): Promise<Course[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("courses")
    .select(courseSelect)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[courses] getAllCoursesAdmin failed", error);
    return [];
  }

  return (data ?? []).map((row) => {
    const course = mapCourse(row as Record<string, unknown>);
    const allIntakes = ((row as Record<string, unknown>).intakes as Intake[]) ?? [];
    return { ...course, intakes: allIntakes };
  });
}

export async function getCourseByIdAdmin(id: string): Promise<Course | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("courses")
    .select(courseSelect)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const course = mapCourse(data as Record<string, unknown>);
  const allIntakes = ((data as Record<string, unknown>).intakes as Intake[]) ?? [];
  return { ...course, intakes: allIntakes };
}

export async function getIntakesForCourseAdmin(
  courseId: string,
): Promise<Intake[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("intakes")
    .select("*")
    .eq("course_id", courseId)
    .order("start_date", { ascending: false });

  if (error) {
    return [];
  }

  return (data ?? []) as Intake[];
}

export async function getAllIntakesAdmin(): Promise<
  (Intake & { course?: { title: string; slug: string } })[]
> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("intakes")
    .select("*, course:courses(title, slug)")
    .order("start_date", { ascending: false });

  if (error) {
    return [];
  }

  return (data ?? []) as (Intake & { course?: { title: string; slug: string } })[];
}

export async function getIntakeByIdAdmin(
  id: string,
): Promise<(Intake & { course?: Course }) | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("intakes")
    .select(`*, course:courses(${courseSelect})`)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as Record<string, unknown>;
  const courseData = row.course as Record<string, unknown> | null;
  return {
    ...(row as unknown as Intake),
    course: courseData ? mapCourse(courseData) : undefined,
  };
}
