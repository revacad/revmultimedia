"use client";

import { useTransition } from "react";
import { togglePublish } from "@/actions/course";

interface CoursePublishToggleProps {
  courseId: string;
  isPublished: boolean;
}

export default function CoursePublishToggle({
  courseId,
  isPublished,
}: CoursePublishToggleProps) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await togglePublish(courseId, !isPublished);
        });
      }}
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        isPublished
          ? "bg-accent/15 text-accent"
          : "bg-brand-gray-100 text-brand-gray-600"
      }`}
    >
      {pending ? "…" : isPublished ? "Published" : "Draft"}
    </button>
  );
}
