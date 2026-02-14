import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
}

export function Progress({
  value,
  max = 100,
  className,
  ...props
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div
      className={cn(
        "h-2 w-full overflow-hidden rounded-full bg-gray-100",
        className,
      )}
      {...props}
    >
      <div
        className="h-full rounded-full bg-[#7C3AED] transition-all duration-300"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
