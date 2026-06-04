import { notFound } from "next/navigation";
import CourseForm from "@/components/admin/courses/CourseForm";
import { requireStaffAdmin } from "@/lib/auth/requireAdmin";
import { getCourseByIdAdmin } from "@/lib/courses/queries";

interface EditCoursePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCoursePage({ params }: EditCoursePageProps) {
  await requireStaffAdmin();
  const { id } = await params;
  const course = await getCourseByIdAdmin(id);

  if (!course) {
    notFound();
  }

  return (
    <CourseForm course={course} />
  );
}
