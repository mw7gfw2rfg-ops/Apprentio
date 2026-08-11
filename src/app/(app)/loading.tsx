// Next.js shows this automatically for any pending navigation between
// (app) route segments (sidebar links, etc.) while the target page's data
// is still loading -- every page in here is dynamic (reads the session),
// so these are real server round-trips, not instant client swaps. The
// sidebar/header stay mounted (this only replaces the content slot), so
// this is the immediate visible acknowledgement that a click registered.
export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="loading-bar-track h-0.5 w-full bg-primary/15"
    >
      <div className="loading-bar-fill h-full w-1/4 bg-primary" />
    </div>
  );
}
