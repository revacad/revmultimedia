import HomePageClient from "@/components/public/home/HomePageClient";
import { getPublishedCourses } from "@/lib/courses/queries";

export const metadata = {
  title: "Rev Multimedia Academy - Creative Education for the AI Era",
  description:
    "Graphic Design, Motion Graphics, and Video Editing training in Accra, Ghana. Build skills that cannot be automated.",
};

export default async function HomePage() {
  const courses = await getPublishedCourses();

  return <HomePageClient courses={courses} />;
}
