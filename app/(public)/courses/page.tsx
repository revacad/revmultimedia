import CoursesPageClient from "@/components/public/courses/CoursesPageClient";
import { getPublishedCourses } from "@/lib/courses/queries";

export const metadata = {
  title: "Courses | Rev Multimedia Academy",
  description:
    "Explore graphic design, motion graphics, and video editing programmes at Rev Multimedia Academy in Accra, Ghana.",
};

export default async function CoursesPage() {
  const courses = await getPublishedCourses();

  return <CoursesPageClient courses={courses} />;
}
