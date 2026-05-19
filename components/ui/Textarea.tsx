import { TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full rounded-md border border-brand-gray-200 bg-white px-4 py-3",
      "font-body text-[15px] text-dark placeholder:text-brand-gray-400",
      "focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15",
      "disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export default Textarea;
