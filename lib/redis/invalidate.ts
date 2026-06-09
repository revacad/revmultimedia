import { redis } from "@/lib/redis/client";

const PUBLIC_COURSES_LIST_KEY = "public:courses:list";
const PUBLIC_INTAKES_ACTIVE_KEY = "public:intakes:active";
const ADMIN_DASHBOARD_STATS_KEY = "admin:dashboard:stats";

function logInvalidateError(operation: string, error: unknown): void {
  console.error(`[redis:invalidate] ${operation} failed`, error);
}

export function invalidateCourse(slug: string): void {
  void redis
    .del(
      `course:${slug}`,
      PUBLIC_COURSES_LIST_KEY,
      "courses:published",
      "courses:featured:home",
    )
    .catch((error) => logInvalidateError("invalidateCourse", error));
}

export function invalidateIntakes(courseId: string): void {
  void redis
    .del(`intakes:course:${courseId}`, PUBLIC_INTAKES_ACTIVE_KEY)
    .catch((error) => logInvalidateError("invalidateIntakes", error));
}

export function invalidateActiveIntakesCache(): void {
  void redis
    .del(PUBLIC_INTAKES_ACTIVE_KEY)
    .catch((error) => logInvalidateError("invalidateActiveIntakesCache", error));
}

export function invalidateStudentProfile(studentId: string): void {
  void redis
    .del(`student:${studentId}:profile`)
    .catch((error) => logInvalidateError("invalidateStudentProfile", error));
}

export function invalidateAdminStats(): void {
  void redis
    .del(ADMIN_DASHBOARD_STATS_KEY, "admin:stats")
    .catch((error) => logInvalidateError("invalidateAdminStats", error));
}

export function invalidateSystemSettings(): void {
  void redis
    .del("settings:system")
    .catch((error) => logInvalidateError("invalidateSystemSettings", error));
}
