import Link from "next/link";
import AuthForm from "@/components/AuthForm";
import { signup } from "@/app/actions/auth";

export default function SignupPage() {
  return (
    <AuthForm
      action={signup}
      title="Create an account"
      submitLabel="Sign up"
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </>
      }
    />
  );
}
