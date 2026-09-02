import Link from "next/link";

export function LegalTabs({ active }: { active: "privacy" | "terms" }) {
  const tabClass = (tab: "privacy" | "terms") =>
    tab === active
      ? "rounded-full border-2 border-foreground bg-foreground px-4 py-2 text-sm font-bold text-background"
      : "rounded-full border-2 border-border bg-transparent px-4 py-2 text-sm font-bold text-foreground hover:bg-secondary";

  return (
    <div className="mt-6 flex flex-wrap gap-2">
      <Link href="/privacy" className={tabClass("privacy")}>
        Privacy Policy
      </Link>
      <Link href="/terms" className={tabClass("terms")}>
        Terms of Service
      </Link>
    </div>
  );
}
