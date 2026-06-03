import Link from "next/link";
import Button from "@/components/ui/Button";
import IntakeTable from "@/components/admin/intakes/IntakeTable";
import { requireStaffAdmin } from "@/lib/auth/requireAdmin";
import { getAllCoursesAdmin, getAllCoursesAdminResult, getAllIntakesAdminResult } from "@/lib/courses/queries";
import { getWaitlistCountsByIntake } from "@/actions/waitlist";

export const metadata = {
  title: "Intakes — Admin",
};

export default async function AdminIntakesPage() {
  await requireStaffAdmin();
  const [intakesResult, coursesResult, waitlistCounts] = await Promise.all([
    getAllIntakesAdminResult(),
    getAllCoursesAdminResult(),
    getWaitlistCountsByIntake(),
  ]);

  const intakes = intakesResult.data;
  const courses = coursesResult.data;
  const fetchError = intakesResult.error ?? coursesResult.error;

  const courseOptions = courses.map((course) => ({
    id: course.id,
    title: course.title,
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-dark">Intakes</h1>
          <p className="text-gray-600 text-sm mt-1">
            Manage cohorts and application windows per course.
          </p>
        </div>
        <Link href="/admin/intakes/new">
          <Button variant="primary">New intake</Button>
        </Link>
      </div>
      <IntakeTable
        intakes={intakes}
        courses={courseOptions}
        waitlistCounts={waitlistCounts}
        fetchError={fetchError}
      />
    </div>
  );
}
