import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const instant = false;

interface Props {
  searchParams: Promise<{
    client_id?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
  }>;
}

export default async function ReportesPage({ searchParams }: Props) {
  const supabase = await createClient();

  // 1. 🔒 SEGURIDAD: Solo entran Administradores y Programadores
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect('/auth/login');

  const { data: perfil } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (perfil?.role !== 'admin' && perfil?.role !== 'developer') {
    return redirect('/necesidades/nueva');
  }

  // 2. EXTRAER LOS FILTROS SELECCIONADOS DESDE LA URL
  const resolvedParams = await searchParams;
  const filterClient = resolvedParams?.client_id || '';
  const filterDesde = resolvedParams?.fecha_desde || '';
  const filterHasta = resolvedParams?.fecha_hasta || '';

  // 3. CONSULTAR LA LISTA COMPLETA DE EMPRESAS PARA EL DESPLEGABLE
  const { data: empresas } = await supabase.from('clients').select('id, name').order('name');

  // 4. CONSTRUIR LA CONSULTA HISTÓRICA CON FILTROS DINÁMICOS
  let query = supabase
    .from('needs')
    .select('id, description, status, date, image_url, clients(name)')
    .order('date', { ascending: false });

  // Aplicar filtro por empresa si se seleccionó una
  if (filterClient) {
    query = query.eq('client_id', parseInt(filterClient));
  }

  // Aplicar filtro por Fecha Desde (Inicio del día elegido)
  if (filterDesde) {
    query = query.gte('date', `${filterDesde}T00:00:00.000Z`);
  }

  // Aplicar filtro por Fecha Hasta (Final del día elegido)
  if (filterHasta) {
    query = query.lte('date', `${filterHasta}T23:59:59.999Z`);
  }

  const { data: necesidades, error } = await query;

  // 5. CALCULAR MÉTRICAS EN TIEMPO REAL SOBRE EL RESULTADO FILTRADO
  const totalTickets = necesidades?.length || 0;
  const enProceso = necesidades?.filter((n: any) => n.status === 'en proceso').length || 0;
  const terminados = necesidades?.filter((n: any) => n.status === 'terminado').length || 0;
   return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 p-6 font-sans">
      <div className="max-w-6xl mx-auto mt-6">
        
        {/* Encabezado */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Módulo de Reportes e Históricos
          </h1>
          <p className="text-sm text-gray-400 mt-1">Consulta cruzada y auditoría de requerimientos técnicos.</p>
        </div>

        {/* 📊 TARJETAS DE INDICADORES EN TIEMPO REAL */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <div className="bg-[#111827] border border-gray-800/60 p-5 rounded-2xl shadow-lg">
            <p className="text-xs uppercase font-bold tracking-wider text-gray-500">Total Solicitudes</p>
            <p className="text-3xl font-black text-indigo-400 mt-1">{totalTickets}</p>
          </div>
          <div className="bg-[#111827] border border-gray-800/60 p-5 rounded-2xl shadow-lg">
            <p className="text-xs uppercase font-bold tracking-wider text-gray-500">En Proceso</p>
            <p className="text-3xl font-black text-yellow-500 mt-1">{enProceso}</p>
          </div>
          <div className="bg-[#111827] border border-gray-800/60 p-5 rounded-2xl shadow-lg">
            <p className="text-xs uppercase font-bold tracking-wider text-gray-500">Terminados</p>
            <p className="text-3xl font-black text-emerald-500 mt-1">{terminados}</p>
          </div>
        </div>

        {/* 🔍 FORMULARIO DE FILTROS HISTÓRICOS */}
        <div className="bg-[#111827] border border-gray-800/80 p-6 rounded-2xl shadow-xl mb-8">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">Filtrar Historial</h3>
          
          <form method="GET" action="/reportes" className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Empresa Cliente</label>
              <select
                name="client_id"
                defaultValue={filterClient}
                className="w-full p-2.5 text-sm border rounded-xl bg-[#1F2937] border-gray-800 text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Todas las empresas</option>
                {empresas?.map((e) => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Fecha Desde</label>
              <input
                type="date"
                name="fecha_desde"
                defaultValue={filterDesde}
                className="w-full p-2.5 text-sm border rounded-xl bg-[#1F2937] border-gray-800 text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 color-scheme-dark"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">Fecha Hasta</label>
              <input
                type="date"
                name="fecha_hasta"
                defaultValue={filterHasta}
                className="w-full p-2.5 text-sm border rounded-xl bg-[#1F2937] border-gray-800 text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 color-scheme-dark"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl text-sm transition-all shadow-md active:scale-95"
              >
                Aplicar Filtros
              </button>
              <Link
                href="/reportes"
                className="bg-[#1F2937] hover:bg-[#374151] border border-gray-800 text-gray-300 font-medium py-2.5 px-4 rounded-xl text-sm transition-all text-center"
              >
                Limpiar
              </Link>
            </div>
          </form>
        </div>

        {/* 📋 TABLA DEL HISTÓRICO FILTRADO */}
        {error && (
          <p className="text-red-400 bg-red-950/30 border border-red-900/50 p-4 rounded-xl mb-6">
            Error al consultar histórico: {error.message}
          </p>
        )}

        {/* 💡 CORREGIDO: Ahora usa 'necesidades' en lugar de 'needs' */}
        {necesidades?.length === 0 ? (
          <p className="text-gray-400 bg-[#111827] p-12 text-center rounded-2xl border border-dashed border-gray-800">
            No se encontraron requerimientos para los filtros seleccionados.
          </p>
        ) : (
          <div className="bg-[#111827] rounded-2xl border border-gray-800/60 overflow-hidden shadow-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#1F2937]/50 text-gray-400 font-semibold text-xs uppercase tracking-wider border-b border-gray-800/80">
                  <th className="p-4 pl-6">Fecha y Hora</th>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Descripción de Necesidad</th>
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
                        Ver Detalle →
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
