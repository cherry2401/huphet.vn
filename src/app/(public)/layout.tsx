import { AutoTracker } from "@/components/analytics/auto-tracker";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AutoTracker />
      {children}
    </>
  );
}
