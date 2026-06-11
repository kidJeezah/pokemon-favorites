interface EmptyStateProps {
  title: string;
  hint?: string;
}

export function EmptyState({ title, hint }: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center p-10">
      <div className="max-w-sm border-[3px] border-dashed border-sticker bg-card p-7 text-center shadow-sticker">
        <div className="text-5xl leading-none">·ﻌ·</div>
        <div className="mt-3 text-2xl">{title}</div>
        {hint && <div className="mt-1.5 text-lg text-muted">{hint}</div>}
      </div>
    </div>
  );
}
