import type { ReactNode } from "react";

export function FeedMessage({
  title,
  description,
  action,
  role,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  role?: "alert" | "status";
}) {
  return (
    <div
      role={role}
      className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-6 py-12 text-center"
    >
      <p className="font-serif text-xl font-semibold">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
