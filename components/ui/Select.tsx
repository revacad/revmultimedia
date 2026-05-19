import { SelectHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "w-full rounded-md border border-gray-200 bg-white px-4 py-3",
        "font-body text-[15px] text-dark",
        "focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15",
        "disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  ),
);
Select.displayName = "Select";

export default Select;
