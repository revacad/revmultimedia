import IntakeForm from "@/components/admin/intakes/IntakeForm";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { getAllCoursesAdmin } from "@/lib/courses/queries";

export const metadata = {
  title: "New intake — Admin",
};

interface NewIntakePageProps {
  searchParams: Promise<{ course?: string }>;
}

export default async function NewIntakePage({ searchParams }: NewIntakePageProps) {
  await requireAdmin();
  const { course: courseId } = await searchParams;
  const courses = await getAllCoursesAdmin();

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-dark mb-8">
        Create intake
      </h1>
      <IntakeForm courses={courses} defaultCourseId={courseId} />
    </div>
  );
}
