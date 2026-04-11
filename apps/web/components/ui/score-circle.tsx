import { cn } from "@/lib/utils";

interface ScoreCircleProps {
  score: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

function getScoreVariant(score: number) {
  if (score >= 75) return "high";
  if (score >= 50) return "mid";
  return "low";
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-lg",
};

const variantClasses = {
  high: "bg-success-light text-success",
  mid: "bg-warning-light text-warning",
  low: "bg-error-light text-error",
};

export function ScoreCircle({
  score,
  size = "md",
  className,
}: ScoreCircleProps) {
  const variant = getScoreVariant(score);

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full font-bold",
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
    >
      {score}
    </div>
  );
}
