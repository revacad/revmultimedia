import Link from "next/link";
import type { Intake } from "@/lib/courses/types";
import { formatDate } from "@/lib/utils";
import IntakeCloseButton from "@/components/admin/intakes/IntakeCloseButton";

interface IntakeRow extends Intake {
  course?: { title: string; slug: string };
}

interface IntakeTableProps {
  intakes: IntakeRow[];
}

export default function IntakeTable({ intakes }: IntakeTableProps) {
  if (intakes.length === 0) {
    return (
      <p className="text-brand-gray-600 text-sm py-8 text-center">
        No intakes yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-brand-gray-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-brand-gray-200 bg-brand-gray-50">
            <th className="px-4 py-3 font-semibold text-brand-gray-600 uppercase text-xs tracking-wide">
              Intake
            </th>
            <th className="px-4 py-3 font-semibold text-brand-gray-600 uppercase text-xs tracking-wide">
              Course
            </th>
            <th className="px-4 py-3 font-semibold text-brand-gray-600 uppercase text-xs tracking-wide">
              Dates
            </th>
            <th className="px-4 py-3 font-semibold text-brand-gray-600 uppercase text-xs tracking-wide">
              Enrolled
            </th>
            <th className="px-4 py-3 font-semibold text-brand-gray-600 uppercase text-xs tracking-wide">
              Status
            </th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {intakes.map((intake) => (
            <tr
              key={intake.id}
              className="border-b border-brand-gray-100 hover:bg-brand-gray-50/80"
            >
              <td className="px-4 py-3 font-medium text-dark">{intake.name}</td>
              <td className="px-4 py-3 text-brand-gray-600">
                {intake.course?.title ?? "—"}
              </td>
              <td className="px-4 py-3 text-brand-gray-600">
                {formatDate(intake.start_date)} – {formatDate(intake.end_date)}
              </td>
              <td className="px-4 py-3 text-brand-gray-600">
                {intake.enrolled_count}
                {intake.max_slots != null ? ` / ${intake.max_slots}` : ""}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    intake.is_closed
                      ? "bg-brand-gray-100 text-brand-gray-600"
                      : "bg-accent/15 text-accent"
                  }`}
                >
                  {intake.is_closed ? "Closed" : "Open"}
                </span>
              </td>
              <td className="px-4 py-3 text-right space-x-3">
                <Link
                  href={`/admin/intakes/${intake.id}`}
                  className="text-primary hover:text-primary-hover font-medium"
                >
                  Edit
                </Link>
                {!intake.is_closed && (
                  <IntakeCloseButton intakeId={intake.id} />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
