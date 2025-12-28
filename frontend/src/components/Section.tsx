import type { ReactNode } from "react";

interface Props {
  title: string;
  children: ReactNode;
}

/**
 * Reusable section component with a title.
 */
export function Section({ title, children }: Props) {
  return (
    <div className="mb-6">
      <h3 className="font-medium mb-2 text-gray-700">{title}</h3>
      {children}
    </div>
  );
}
