import CourseForm from "@/components/admin/courses/CourseForm";
import { requireStaffAdmin } from "@/lib/auth/requireAdmin";

export const metadata = {
  title: "New course - Admin",
};

export default async function NewCoursePage() {
  await requireStaffAdmin();
  return <CourseForm />;
}
