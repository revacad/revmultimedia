import { notFound } from "next/navigation";
import IntakeForm from "@/components/admin/intakes/IntakeForm";
import { getAllCoursesAdmin, getIntakeByIdAdmin } from "@/lib/courses/queries";

interface EditIntakePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditIntakePage({ params }: EditIntakePageProps) {
  const { id } = await params;
  const [intake, courses] = await Promise.all([
    getIntakeByIdAdmin(id),
    getAllCoursesAdmin(),
  ]);

  if (!intake) {
    notFound();
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-dark mb-8">
        Edit intake
      </h1>
      <IntakeForm courses={courses} intake={intake} />
    </div>
  );
}
