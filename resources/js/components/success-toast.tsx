import { CircleCheck, X } from 'lucide-react';
import { useEffect } from 'react';

export default function SuccessToast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
    useEffect(() => {
        const timer = window.setTimeout(onDismiss, 5000);
        return () => window.clearTimeout(timer);
    }, [onDismiss]);

    return (
        <div className="fixed top-4 right-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm items-start gap-3 rounded-lg border border-green-200 bg-background p-4 shadow-lg dark:border-green-900">
            <CircleCheck className="size-5 shrink-0 text-green-600 dark:text-green-400" aria-hidden="true" />
            <p role="status" aria-live="polite" aria-atomic="true" className="flex-1 text-sm">
                {message}
            </p>
            <button
                type="button"
                onClick={onDismiss}
                aria-label="Dismiss notification"
                className="rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2"
            >
                <X className="size-4" aria-hidden="true" />
            </button>
        </div>
    );
}
