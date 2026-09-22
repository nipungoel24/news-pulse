import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-ink bg-paper pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-ink-muted sm:flex-row sm:items-center sm:justify-between">
        <p>Public RSS only. Headlines belong to their publishers.</p>
        <div className="flex flex-wrap gap-4">
          <Link to="/about" className="underline-offset-4 hover:text-ink hover:underline">
            Method
          </Link>
          <Link to="/privacy" className="underline-offset-4 hover:text-ink hover:underline">
            Privacy
          </Link>
          <Link to="/terms" className="underline-offset-4 hover:text-ink hover:underline">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}
