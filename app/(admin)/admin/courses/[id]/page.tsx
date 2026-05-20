import { notFound } from "next/navigation";
import CourseForm from "@/components/admin/courses/CourseForm";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { getCourseByIdAdmin } from "@/lib/courses/queries";

interface EditCoursePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCoursePage({ params }: EditCoursePageProps) {
  await requireAdmin();
  const { id } = await params;
  const course = await getCourseByIdAdmin(id);

  if (!course) {
    notFound();
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-dark mb-2">
        Edit course
      </h1>
      <p className="text-gray-600 text-sm mb-8">{course.title}</p>
      <CourseForm course={course} />
    </div>
  );
}
