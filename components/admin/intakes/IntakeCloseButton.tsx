"use client";

import { useTransition } from "react";
import { closeIntake } from "@/actions/intake";

interface IntakeCloseButtonProps {
  intakeId: string;
}

export default function IntakeCloseButton({ intakeId }: IntakeCloseButtonProps) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await closeIntake(intakeId);
        });
      }}
      className="text-gray-600 hover:text-red-600 text-sm font-medium"
    >
      {pending ? "…" : "Close"}
    </button>
  );
}
