import Badge from "@/components/ui/Badge";
import { formatMode } from "@/lib/courses/labels";
import type { CourseMode } from "@/lib/courses/types";

interface ModeBadgeProps {
  mode: CourseMode;
}

export default function ModeBadge({ mode }: ModeBadgeProps) {
  return <Badge variant={mode}>{formatMode(mode)}</Badge>;
}
