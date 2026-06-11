interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="flex items-center justify-center p-10" role="alert">
      <div className="max-w-sm border-[3px] border-dashed border-sticker bg-card p-7 text-center shadow-sticker">
        <div className="text-5xl leading-none">×ﻌ×</div>
        <div className="mt-3 text-2xl">Something went wrong</div>
        <div className="mt-1.5 text-lg text-muted">{message}</div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 cursor-pointer border-[3px] border-ink bg-cream px-4 py-1 font-pixel text-xl shadow-pixel transition-transform duration-100 hover:-translate-y-0.5"
          >
            ↻ Retry
          </button>
        )}
      </div>
    </div>
  );
}
