"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";
import Select from "@/components/ui/Select";
import { createIntake, updateIntake } from "@/actions/intake";
import type { Course, Intake } from "@/lib/courses/types";

interface IntakeFormProps {
  courses: Course[];
  intake?: Intake;
  defaultCourseId?: string;
}

export default function IntakeForm({
  courses,
  intake,
  defaultCourseId,
}: IntakeFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const result = intake
      ? await updateIntake(intake.id, formData)
      : await createIntake(formData);

    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    router.push("/admin/intakes");
    router.refresh();
  }

  return (
    <form action={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <p className="rounded-md bg-red-50 border border-red-200 text-red-600 px-4 py-3 text-sm">
          {error}
        </p>
      )}

      <div>
        <Label htmlFor="course_id">Course</Label>
        <Select
          id="course_id"
          name="course_id"
          defaultValue={intake?.course_id ?? defaultCourseId ?? ""}
          required
        >
          <option value="" disabled>
            Select a course
          </option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="name">Intake name</Label>
        <Input
          id="name"
          name="name"
          defaultValue={intake?.name}
          placeholder="e.g. March 2026 Cohort"
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="start_date">Start date</Label>
          <Input
            id="start_date"
            name="start_date"
            type="date"
            defaultValue={intake?.start_date}
            required
          />
        </div>
        <div>
          <Label htmlFor="end_date">End date</Label>
          <Input
            id="end_date"
            name="end_date"
            type="date"
            defaultValue={intake?.end_date}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="application_deadline">Application deadline</Label>
          <Input
            id="application_deadline"
            name="application_deadline"
            type="date"
            defaultValue={intake?.application_deadline ?? ""}
          />
        </div>
        <div>
          <Label htmlFor="max_slots">Max slots</Label>
          <Input
            id="max_slots"
            name="max_slots"
            type="number"
            min="1"
            defaultValue={intake?.max_slots ?? ""}
          />
        </div>
      </div>

      <Button type="submit" variant="primary" disabled={loading}>
        {loading ? "Saving…" : intake ? "Update intake" : "Create intake"}
      </Button>
    </form>
  );
}
