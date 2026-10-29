import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function NavbarGlobal() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null; // Si no hay sesión (ej: en el login), no se muestra la barra

  const { data: perfil } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single();

  // Server Action nativo aislado para cerrar sesión
  async function cerrarSesion() {
    'use server';
    const supabaseLogout = await createClient();
    await supabaseLogout.auth.signOut();
    redirect('/auth/login');
  }

  return (
    <nav className="bg-[#111827] border-b border-gray-800/80 text-gray-200 px-6 py-4 shadow-xl">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        
        {/* Identidad */}
        <div className="flex items-center gap-6">
          <Link href={perfil?.role === 'client' ? '/necesidades/nueva' : '/dashboard'} className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent tracking-wide">
            ControlApp MWS
          </Link>

          {/* Menú según Rol */}
          <div className="hidden sm:flex items-center gap-4 text-sm font-medium">
            {(perfil?.role === 'admin' || perfil?.role === 'developer') && (
              <Link href="/dashboard" className="text-gray-400 hover:text-gray-100 transition-colors">
                📋 Dashboard
              </Link>
            )}

            <Link href="/necesidades/nueva" className="text-gray-400 hover:text-gray-100 transition-colors">
              ➕ Reportar Necesidad
            </Link>

            {(perfil?.role === 'admin' || perfil?.role === 'developer') && (
              <Link href="/reportes" className="text-gray-400 hover:text-gray-100 transition-colors">
                📊 Reportes
              </Link>
            )}

            {perfil?.role === 'admin' && (
              <Link href="/admin" className="text-gray-400 hover:text-gray-100 transition-colors bg-indigo-950/40 border border-indigo-900/40 px-3 py-1 rounded-xl text-xs text-indigo-400">
                ⚙️ Consola Admin
              </Link>
            )}
          </div>
        </div>

        {/* Perfil y Logout */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <p className="text-xs font-semibold text-gray-300">{perfil?.full_name}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">{perfil?.role}</p>
          </div>
          
          <form action={cerrarSesion}>
            <button type="submit" className="text-xs bg-red-950/20 hover:bg-red-950/50 border border-red-900/40 text-red-400 px-3 py-1.5 rounded-xl font-medium transition-all active:scale-95">
              Salir ↗
            </button>
          </form>
        </div>

      </div>
    </nav>
  );
}

