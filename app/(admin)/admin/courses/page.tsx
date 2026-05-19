import Link from "next/link";
import Button from "@/components/ui/Button";
import CourseTable from "@/components/admin/courses/CourseTable";
import { getAllCoursesAdmin } from "@/lib/courses/queries";

export const metadata = {
  title: "Courses — Admin",
};

export default async function AdminCoursesPage() {
  const courses = await getAllCoursesAdmin();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-dark">Courses</h1>
          <p className="text-brand-gray-600 text-sm mt-1">
            Manage programmes shown on the public site.
          </p>
        </div>
        <Link href="/admin/courses/new">
          <Button variant="primary">New course</Button>
        </Link>
      </div>
      <CourseTable courses={courses} />
    </div>
  );
}
