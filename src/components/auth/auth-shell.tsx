import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col justify-center px-6 py-16">
      <Link href="/" className="self-start">
        <Logo />
      </Link>

      <div className="mt-8 rounded-2xl border border-border bg-surface p-7 shadow-[0_1px_2px_rgba(0,0,0,0.06),0_24px_60px_-32px_rgba(0,0,0,0.45)]">
        <h1 className="font-display text-2xl font-bold">{title}</h1>
        <p className="mt-1.5 text-sm text-muted">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </div>

      <p className="mt-5 text-center text-sm text-muted">{footer}</p>
    </main>
  );
}
