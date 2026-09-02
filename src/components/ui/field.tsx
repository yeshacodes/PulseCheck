import { forwardRef, useId } from "react";
import { cn } from "@/lib/cn";

const inputClass =
  "h-11 w-full rounded-lg border border-border bg-surface-2 px-3.5 text-sm text-foreground " +
  "transition-[border-color,background-color,box-shadow] placeholder:text-muted " +
  "focus-visible:border-accent focus-visible:bg-surface focus-visible:outline-none " +
  "focus-visible:ring-2 focus-visible:ring-accent/35 disabled:opacity-50";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(inputClass, className)} {...props} />;
  },
);

interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
  children: (id: string) => React.ReactNode;
}

/** Label + control + hint/error wrapper. `children` receives the generated id. */
export function Field({ label, error, hint, children }: FieldProps) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      {children(id)}
      {error ? (
        <p className="text-xs text-down">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
