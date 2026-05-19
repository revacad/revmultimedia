import Link from "next/link";
import Badge from "@/components/ui/Badge";
import { formatCategory, formatMode } from "@/lib/courses/labels";
import type { Course } from "@/lib/courses/types";
import { formatGHS } from "@/lib/utils";
import CoursePublishToggle from "@/components/admin/courses/CoursePublishToggle";

interface CourseTableProps {
  courses: Course[];
}

export default function CourseTable({ courses }: CourseTableProps) {
  if (courses.length === 0) {
    return (
      <p className="text-brand-gray-600 text-sm py-8 text-center">
        No courses yet. Create your first course.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-brand-gray-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-brand-gray-200 bg-brand-gray-50">
            <th className="px-4 py-3 font-semibold text-brand-gray-600 uppercase text-xs tracking-wide">
              Title
            </th>
            <th className="px-4 py-3 font-semibold text-brand-gray-600 uppercase text-xs tracking-wide">
              Category
            </th>
            <th className="px-4 py-3 font-semibold text-brand-gray-600 uppercase text-xs tracking-wide">
              Mode
            </th>
            <th className="px-4 py-3 font-semibold text-brand-gray-600 uppercase text-xs tracking-wide">
              Fee
            </th>
            <th className="px-4 py-3 font-semibold text-brand-gray-600 uppercase text-xs tracking-wide">
              Status
            </th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {courses.map((course) => (
            <tr
              key={course.id}
              className="border-b border-brand-gray-100 hover:bg-brand-gray-50/80"
            >
              <td className="px-4 py-3 font-medium text-dark">{course.title}</td>
              <td className="px-4 py-3">
                <Badge variant={course.category}>
                  {formatCategory(course.category)}
                </Badge>
              </td>
              <td className="px-4 py-3 text-brand-gray-600">
                {formatMode(course.mode)}
              </td>
              <td className="px-4 py-3 text-brand-gray-600">
                {formatGHS(course.tuition_fee_ghs)}
              </td>
              <td className="px-4 py-3">
                <CoursePublishToggle
                  courseId={course.id}
                  isPublished={course.is_published}
                />
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/admin/courses/${course.id}`}
                  className="text-primary hover:text-primary-hover font-medium"
                >
                  Edit
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
