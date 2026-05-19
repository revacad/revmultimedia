import { redis } from "@/lib/redis/client";

function logInvalidateError(operation: string, error: unknown): void {
  console.error(`[redis:invalidate] ${operation} failed`, error);
}

export function invalidateCourse(slug: string): void {
  void redis
    .del(`course:${slug}`, "courses:published", "courses:featured:home")
    .catch((error) => logInvalidateError("invalidateCourse", error));
}

export function invalidateIntakes(courseId: string): void {
  void redis
    .del(`intakes:course:${courseId}`)
    .catch((error) => logInvalidateError("invalidateIntakes", error));
}

export function invalidateStudentProfile(studentId: string): void {
  void redis
    .del(`student:${studentId}:profile`)
    .catch((error) => logInvalidateError("invalidateStudentProfile", error));
}

export function invalidateAdminStats(): void {
  void redis
    .del("admin:stats")
    .catch((error) => logInvalidateError("invalidateAdminStats", error));
}

export function invalidateSystemSettings(): void {
  void redis
    .del("settings:system")
    .catch((error) => logInvalidateError("invalidateSystemSettings", error));
}
