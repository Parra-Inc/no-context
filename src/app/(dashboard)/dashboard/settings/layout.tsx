import { SettingsNav } from "@/components/dashboard/settings-nav";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Settings</h1>
      <SettingsNav />
      {children}
    </div>
  );
}
