import Link from "next/link";
import AuthForm from "@/components/AuthForm";
import { login } from "@/app/actions/auth";

export default function LoginPage() {
  return (
    <AuthForm
      action={login}
      title="Log in"
      submitLabel="Log in"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </>
      }
    />
  );
}
