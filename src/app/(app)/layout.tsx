import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/auth-actions";
import NativeBridge from "@/components/NativeBridge";
import SignOutButton from "@/components/SignOutButton";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <NativeBridge />
      <header className="border-b border-neutral-800">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/" className="font-bold text-emerald-400">
              Lucro Real
            </Link>
            <Link href="/" className="text-neutral-300 hover:text-white">
              Dashboard
            </Link>
            <Link href="/carro" className="text-neutral-300 hover:text-white">
              Meu carro
            </Link>
            <Link href="/configuracoes" className="text-neutral-300 hover:text-white">
              Configurações
            </Link>
          </nav>
          <form action={signOut} className="flex items-center gap-3">
            <span className="hidden text-xs text-neutral-500 sm:inline">{user?.email}</span>
            <SignOutButton />
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
    </div>
  );
}
