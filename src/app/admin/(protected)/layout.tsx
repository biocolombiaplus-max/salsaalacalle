import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AdminNav from "@/components/admin/AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-[#0b0709] text-foreground flex flex-col md:flex-row">
      <AdminNav email={session.email} nombre={session.nombre} />
      <main className="flex-1 min-w-0 p-5 sm:p-8">{children}</main>
    </div>
  );
}
