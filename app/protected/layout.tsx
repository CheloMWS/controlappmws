import { createClient } from "@/lib/supabase/server";
import NavbarGlobal from "@/app/components/NavbarGlobal"; // Tu barra real
import { AuthButton } from "@/components/auth-button";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // 1. Validamos que exista un usuario logueado en la sesión
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/auth/login");
  }

  // 2. Traemos el perfil para validar el rol en la base de datos
  const { data: perfil } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // 3. Evaluamos si es administrador de forma estricta
  const esAdmin = perfil?.role === "admin";

  return (
    <main className="min-h-screen bg-[#0B0F19] text-gray-100 flex flex-col">
      {/* 🔒 REGLA DE NEGOCIO: La barra solo se dibuja si el usuario es Administrador */}
      {esAdmin && <NavbarGlobal />}

      <div className="flex-1 w-full max-w-7xl mx-auto p-6">
        {/* Aquí adentro se renderizan tus páginas de clientes y requerimientos */}
        {children}
      </div>

      <footer className="w-full flex items-center justify-between border-t border-gray-800 max-w-7xl mx-auto px-6 py-6 text-xs text-gray-500">
        <p>ControlApp MWS © {new Date().getFullYear()}</p>
        <AuthButton />
      </footer>
    </main>
  );
}

