import { type ReactNode } from 'react';

interface WidgetProps {
  children: ReactNode;
}

export function Widget({ children }: WidgetProps) {
  return (
    <div className="widget">
      {children}
    </div>
  );
}
