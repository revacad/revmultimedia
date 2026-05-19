import type { Intake } from "@/lib/courses/types";

export interface SlotIndicator {
  text: string;
  colorClass: string;
  dotClass: string;
}

export function getSlotsRemaining(intakes: Intake[]): number {
  if (intakes.length === 0) {
    return 0;
  }

  return intakes.reduce((sum, intake) => {
    const max = intake.max_slots ?? 20;
    return sum + Math.max(0, max - intake.enrolled_count);
  }, 0);
}

export function getSlotIndicator(intakes: Intake[]): SlotIndicator {
  const remaining = getSlotsRemaining(intakes);

  if (remaining === 0) {
    return {
      text: "Full",
      colorClass: "text-gray-400",
      dotClass: "bg-gray-400",
    };
  }
  if (remaining === 1) {
    return {
      text: "Last spot!",
      colorClass: "text-red-500",
      dotClass: "bg-red-500",
    };
  }
  if (remaining <= 5) {
    return {
      text: "Almost full",
      colorClass: "text-secondary",
      dotClass: "bg-secondary",
    };
  }
  return {
    text: `${remaining} spots left`,
    colorClass: "text-accent",
    dotClass: "bg-accent",
  };
}
