export interface WidgetFallbackProps {
  readonly title: string;
}

export function WidgetFallback({ title }: WidgetFallbackProps) {
  return (
    <div role="alert">
      <p>{title} failed to load.</p>
    </div>
  );
}
