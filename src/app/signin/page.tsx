import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SignInContent } from "./sign-in-content";

export const metadata = {
  title: "Sign In — No Context",
};

export default async function SignInPage() {
  const session = await auth();

  if (session?.user?.id) {
    redirect("/dashboard");
  }

  return <SignInContent />;
}
