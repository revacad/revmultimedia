"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import { createCourse, updateCourse } from "@/actions/course";
import type { Course } from "@/lib/courses/types";

interface CourseFormProps {
  course?: Course;
}

export default function CourseForm({ course }: CourseFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const result = course
      ? await updateCourse(course.id, formData)
      : await createCourse(formData);

    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    if (course) {
      router.refresh();
    } else if (result.data?.id) {
      router.push(`/admin/courses/${result.data.id}`);
    }
  }

  const curriculumText =
    course?.curriculum && typeof course.curriculum === "object"
      ? JSON.stringify(course.curriculum, null, 2)
      : "";

  return (
    <form action={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <p className="rounded-md bg-red-50 border border-red-200 text-red-600 px-4 py-3 text-sm">
          {error}
        </p>
      )}

      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          defaultValue={course?.title}
          required
        />
      </div>

      <div>
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          name="slug"
          defaultValue={course?.slug}
          placeholder="auto-generated-from-title if empty"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Category</Label>
          <Select
            id="category"
            name="category"
            defaultValue={course?.category ?? "graphic_design"}
            required
          >
            <option value="graphic_design">Graphic Design</option>
            <option value="motion_graphics">Motion Graphics</option>
            <option value="video_editing">Video Editing</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="mode">Mode</Label>
          <Select id="mode" name="mode" defaultValue={course?.mode ?? "online"} required>
            <option value="online">Online</option>
            <option value="in_person">In-Person</option>
            <option value="hybrid">Hybrid</option>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={course?.description ?? ""}
        />
      </div>

      <div>
        <Label htmlFor="curriculum">Curriculum (JSON or one section per line)</Label>
        <Textarea
          id="curriculum"
          name="curriculum"
          rows={6}
          defaultValue={curriculumText}
          placeholder='{"sections":["Week 1: ..."]}'
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="tuition_fee_ghs">Tuition (GHS)</Label>
          <Input
            id="tuition_fee_ghs"
            name="tuition_fee_ghs"
            type="number"
            min="0"
            step="0.01"
            defaultValue={course?.tuition_fee_ghs ?? ""}
            required
          />
        </div>
        <div>
          <Label htmlFor="max_slots">Default max slots</Label>
          <Input
            id="max_slots"
            name="max_slots"
            type="number"
            min="1"
            defaultValue={course?.max_slots ?? 20}
            required
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-brand-gray-800">
        <input
          type="checkbox"
          name="is_published"
          defaultChecked={course?.is_published ?? false}
          className="rounded border-brand-gray-200"
        />
        Published (visible on public site)
      </label>

      <Button type="submit" variant="primary" disabled={loading}>
        {loading ? "Saving…" : course ? "Update course" : "Create course"}
      </Button>
    </form>
  );
}
