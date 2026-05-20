import CourseForm from "@/components/admin/courses/CourseForm";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export const metadata = {
  title: "New course — Admin",
};

export default async function NewCoursePage() {
  await requireAdmin();
  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-dark mb-8">
        Create course
      </h1>
      <CourseForm />
    </div>
  );
}
