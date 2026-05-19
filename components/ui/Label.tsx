import { LabelHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "block font-body text-[13px] font-medium text-gray-600 mb-1.5",
        className,
      )}
      {...props}
    />
  ),
);
Label.displayName = "Label";

export default Label;
