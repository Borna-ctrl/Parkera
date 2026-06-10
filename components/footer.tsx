import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-card">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row">
        <p>© {new Date().getFullYear()} Parkera · Göteborg</p>
        <nav className="flex items-center gap-4">
          <Link href="/terms" className="hover:text-foreground">
            Användarvillkor
          </Link>
          <Link href="/privacy" className="hover:text-foreground">
            Integritetspolicy
          </Link>
        </nav>
      </div>
    </footer>
  );
}
