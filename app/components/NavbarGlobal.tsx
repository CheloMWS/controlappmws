'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client'; 

export default function NavbarGlobal() {
  const [user, setUser] = useState<any>(null);
  const [perfil, setPerfil] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function cargarDatos() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUser(user);
          const { data } = await supabase
            .from('profiles')
            .select('full_name, role')
            .eq('id', user.id)
            .single();
          setPerfil(data);
        }
      } catch (error) {
        console.error("Error cargando perfil:", error);
      } finally {
        setLoading(false);
      }
    }
    cargarDatos();
  }, []);

  async function cerrarSesion() {
    await supabase.auth.signOut();
    window.location.href = '/auth/login';
  }

  if (loading || !user) return null;

  return (
    <nav className="bg-[#111827] border-b border-gray-800/80 text-gray-200 px-6 py-4 shadow-xl">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-6">
          {/* LOGO PRINCIPAL: Vuelve siempre a tu pantalla de inicio con la lista de necesidades */}
          <Link 
            href={perfil?.role === 'client' ? '/necesidades/nueva' : '/protected'} 
            className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent tracking-wide"
          >
            ControlApp MWS
          </Link>
          
          <div className="hidden sm:flex items-center gap-4 text-sm font-medium">
            {/* 📋 DASHBOARD: Te mantiene fijo en tu listado principal de requerimientos en /protected */}
            {(perfil?.role === 'admin' || perfil?.role === 'developer') && (
              <Link href="/protected" className="text-gray-400 hover:text-gray-100 transition-colors">📋 Dashboard</Link>
            )}
            
            <Link href="/necesidades/nueva" className="text-gray-400 hover:text-gray-100 transition-colors">➕ Reportar Necesidad</Link>
            
            {/* 📊 REPORTES: ¡Devuelto! Te lleva al módulo histórico con filtros avanzados por fecha */}
            {(perfil?.role === 'admin' || perfil?.role === 'developer') && (
              <Link href="/reportes" className="text-gray-400 hover:text-gray-100 transition-colors">📊 Reportes</Link>
            )}
            
            {/* ⚙️ CONSOLA ADMIN: Exclusiva para gestionar empresas, usuarios y otorgar permisos */}
            {perfil?.role === 'admin' && (
              <Link href="/admin" className="text-gray-400 hover:text-gray-100 transition-colors bg-indigo-950/40 border border-indigo-900/40 px-3 py-1 rounded-xl text-xs text-indigo-400">⚙️ Consola Admin</Link>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <p className="text-xs font-semibold text-gray-300">{perfil?.full_name}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">{perfil?.role}</p>
          </div>
          <button onClick={cerrarSesion} className="text-xs bg-red-950/20 hover:bg-red-950/50 border border-red-900/40 text-red-400 px-3 py-1.5 rounded-xl font-medium transition-all active:scale-95">
            Salir ↗
          </button>
        </div>
      </div>
    </nav>
  );
}
