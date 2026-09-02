import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { getSessionUser } from "@/lib/supabase/server";

export const metadata = { title: "Log in — PulseCheck" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (await getSessionUser()) redirect("/dashboard");

  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "/dashboard";
  const initialError = typeof params.error === "string" ? params.error : undefined;

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your PulseCheck dashboard."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-accent-strong hover:underline">
            Register
          </Link>
        </>
      }
    >
      <LoginForm next={next} initialError={initialError} />
    </AuthShell>
  );
}
