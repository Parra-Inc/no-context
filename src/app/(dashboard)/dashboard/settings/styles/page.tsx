import { redirect } from "next/navigation";

export default function StylesPage() {
  redirect("/dashboard/settings?tab=styles");
}
