import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { getSessionUser } from "@/lib/supabase/server";

export const metadata = { title: "Register — PulseCheck" };

export default async function RegisterPage() {
  if (await getSessionUser()) redirect("/dashboard");

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start monitoring your first endpoint in under a minute."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-accent-strong hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
