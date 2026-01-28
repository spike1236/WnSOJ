import { cn } from "@/lib/cn";

export default function Container({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("mx-auto w-full max-w-6xl px-4", className)}>{children}</div>;
}

