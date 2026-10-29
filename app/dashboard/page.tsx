import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const instant = false;

export default async function DashboardPage() {
  const supabase = await createClient();

  // 1. 🔒 BLOQUEO DE SEGURIDAD GENERAL: Si no inició sesión, va al login
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return redirect('/auth/login');
  }

  // 2. 🛡️ FILTRO DE ROLES ESTRICTO: Obtener el rol del usuario autenticado
  const { data: perfil } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // Si es un cliente, le denegamos el acceso al panel y lo mandamos a reportar
  if (perfil?.role !== 'developer' && perfil?.role !== 'admin') {
    return redirect('/necesidades/nueva');
  }

  // 3. OBTENER LOS DATOS: Solo se ejecuta si es Programador o Administrador
  const { data: necesidades, error } = await supabase
    .from('needs')
    .select(`
      id,
      description,
      status,
      date,
      image_url,
      clients ( name )
    `)
    .order('date', { ascending: false });

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 p-6 font-sans">
      <div className="max-w-6xl mx-auto mt-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Panel de Requerimientos
            </h1>
            <p className="text-sm text-gray-400 mt-1">Monitoreo y trazabilidad de necesidades en tiempo real.</p>
          </div>
          
          {/* Botón flotante para salir o desloguearse si fuera necesario */}
          <div className="flex items-center gap-4">
            <Link 
              href="/necesidades/nueva" 
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 px-5 rounded-xl transition-all duration-200 shadow-lg shadow-indigo-600/20 active:scale-95 text-sm"
            >
              + Nueva Necesidad
            </Link>
          </div>
        </div>

        {error && (
          <p className="text-red-400 bg-red-950/30 border border-red-900/50 p-4 rounded-xl mb-4">
            Error al cargar datos: {error.message}
          </p>
        )}

        {necesidades?.length === 0 ? (
          <p className="text-gray-400 bg-[#111827] p-12 text-center rounded-2xl border border-dashed border-gray-800">
            No hay necesidades registradas todavía.
          </p>
        ) : (
          <div className="bg-[#111827] rounded-2xl border border-gray-800/60 overflow-hidden shadow-xl shadow-black/40">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#1F2937]/50 text-gray-400 font-semibold text-xs uppercase tracking-wider border-b border-gray-800/80">
                  <th className="p-4 pl-6">Fecha de Envío</th>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Descripción</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4 pr-6 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {necesidades?.map((item: any) => (
                  <tr key={item.id} className="hover:bg-[#1F2937]/30 transition-colors">
                    <td className="p-4 pl-6 text-sm text-gray-400 font-medium">
                      {new Date(item.date).toLocaleDateString('es-AR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                      })} hs
                    </td>
                    <td className="p-4 font-semibold text-gray-200">{item.clients?.name || 'Sin cliente'}</td>
                    <td className="p-4 text-gray-400 max-w-xs truncate text-sm">{item.description}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${
                        item.status === 'recibida' ? 'bg-blue-950/60 text-blue-400 border border-blue-900/50' :
                        item.status === 'sin analizar' ? 'bg-purple-950/60 text-purple-400 border border-purple-900/50' :
                        item.status === 'analizada' ? 'bg-indigo-950/60 text-indigo-400 border border-indigo-900/50' :
                        item.status === 'en proceso' ? 'bg-yellow-950/60 text-yellow-400 border border-yellow-900/50' :
                        item.status === 'terminado' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/50' :
                        'bg-gray-800 text-gray-400'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <Link 
                        href={`/necesidades/${item.id}`} 
                        className="text-indigo-400 hover:text-indigo-300 font-semibold text-sm bg-indigo-950/40 border border-indigo-900/60 rounded-xl px-4 py-1.5 hover:bg-indigo-900/40 transition-all inline-block"
                      >
                        Gestionar →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


