import Link from "next/link";
import { Lock } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto" style={{ background: "#16202b", color: "#b7c2cb" }}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 text-sm">
        <span className="flex items-center gap-2 font-semibold text-white">
          <span className="flex h-[26px] w-[26px] items-center justify-center rounded-[7px] bg-primary text-[13px] font-extrabold text-white">
            P
          </span>
          Parkera
        </span>
        <nav className="flex items-center gap-5">
          <Link href="/terms" className="transition-colors hover:text-white">
            Användarvillkor
          </Link>
          <Link href="/privacy" className="transition-colors hover:text-white">
            Integritetspolicy
          </Link>
          <span className="flex items-center gap-1.5">
            <Lock className="h-3 w-3" style={{ color: "#3aa06a" }} />
            Säker betalning via Stripe
          </span>
        </nav>
      </div>
    </footer>
  );
}
