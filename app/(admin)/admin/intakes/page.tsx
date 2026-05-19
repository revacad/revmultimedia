import Link from "next/link";
import Button from "@/components/ui/Button";
import IntakeTable from "@/components/admin/intakes/IntakeTable";
import { getAllIntakesAdmin } from "@/lib/courses/queries";

export const metadata = {
  title: "Intakes — Admin",
};

export default async function AdminIntakesPage() {
  const intakes = await getAllIntakesAdmin();

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
      <IntakeTable intakes={intakes} />
    </div>
  );
}
