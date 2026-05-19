import { notFound } from "next/navigation";
import CourseDetailView from "@/components/public/courses/CourseDetailView";
import { getCourseBySlug, getPublishedCourses } from "@/lib/courses/queries";

interface CourseDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const courses = await getPublishedCourses();
  return courses.map((course) => ({ slug: course.slug }));
}

export async function generateMetadata({ params }: CourseDetailPageProps) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);

  if (!course) {
    return { title: "Course not found" };
  }

  return {
    title: `${course.title} — Rev Multimedia Academy`,
    description: course.description ?? undefined,
  };
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);

  if (!course) {
    notFound();
  }

  return <CourseDetailView course={course} />;
}
