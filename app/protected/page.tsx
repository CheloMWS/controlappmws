"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client"; // Cambiado a cliente para usar interactividad
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ProtectedPage() {
  const router = useRouter();
  const [perfil, setPerfil] = useState<any>(null);
  const [listaFinal, setListaFinal] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  
  // 🔄 Estado para controlar si se muestran los registros terminados
  const [mostrarTerminados, setMostrarTerminados] = useState(false);

  useEffect(() => {
    async function cargarDatos() {
      try {
        const supabase = createClient();

        // 1. Verificamos el usuario activo
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/auth/login");
          return;
        }

        // 2. Traemos su perfil real para evaluar privilegios
        const { data: perfilData } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        
        setPerfil(perfilData);

        // 3. Matriz de accesos: Consultamos los IDs de empresas asignadas
        const { data: relaciones } = await supabase
          .from("client_users")
          .select("client_id")
          .eq("user_id", user.id);

        const idsAsignados = relaciones?.map((r) => r.client_id) || [];
        let datos: any[] = [];
        const camposSelect = "id, description, status, date, clients(name), profiles:created_by(full_name)";

        // 🚀 REGLA DE FILTRADO SEGURO
        if (perfilData?.role === "admin" || perfilData?.role === "developer") {
          if (idsAsignados.length > 0) {
            const { data } = await supabase
              .from("needs")
              .select(camposSelect)
              .in("client_id", idsAsignados)
              .order("date", { ascending: false });
            datos = data || [];
          }
        } else {
          let queryCliente = supabase.from("needs").select(camposSelect);

          if (idsAsignados.length > 0) {
            const { data } = await queryCliente
              .or(`client_id.in.(${idsAsignados.join(",")}),created_by.eq.${user.id}`)
              .order("date", { ascending: false });
            datos = data || [];
          } else {
            const { data } = await queryCliente
              .eq("created_by", user.id)
              .order("date", { ascending: false });
            datos = data || [];
          }
        }

        setListaFinal(datos);
      } catch (error) {
        console.error("Error cargando los datos:", error);
      } finally {
        setCargando(false);
      }
    }

    cargarDatos();
  }, [router]);

  // 🎛️ Filtrado en tiempo de renderizado: 
  // Si "mostrarTerminados" es falso, excluimos los que tengan status 'terminado' (o 'TERMINADO' en mayúsculas)
  const registrosFiltrados = mostrarTerminados
    ? listaFinal
    : listaFinal.filter(item => item.status?.toLowerCase() !== "terminado");

  if (cargando) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <header className="border-b border-gray-800 pb-4 flex justify-between items-center global-header">
        <div>
          <h1 className="text-2xl font-extrabold text-white">
            {perfil?.role === "admin" ? "Tablero de Control de Solicitudes 👑" : "Mis Requerimientos Técnicos 📁"}
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            {perfil?.role === "admin" 
              ? "Monitoreo de movimientos ingresados para tus empresas asignadas." 
              : "Historial de soporte técnico autorizado para tus clientes y cuentas."}
          </p>
        </div>
        
        {/* Contenedor de Botones alineados a la derecha */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMostrarTerminados(!mostrarTerminados)}
            className={`text-xs font-semibold py-2.5 px-4 rounded-xl transition-all shadow-md border ${
              mostrarTerminados 
                ? "bg-emerald-950 text-emerald-400 border-emerald-800 hover:bg-emerald-900" 
                : "bg-gray-900 text-gray-400 border-gray-800 hover:bg-gray-800 hover:text-white"
            }`}
          >
            {mostrarTerminados ? "👁️ Viendo Terminados" : "📁 Ver Terminados"}
          </button>

          <Link href="/necesidades/nueva" className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2.5 px-4 rounded-xl transition-all shadow-md shrink-0">
            ➕ Nueva Solicitud
          </Link>
        </div>
      </header>

      {registrosFiltrados.length === 0 ? (
        <div className="text-center text-sm text-gray-500 italic bg-[#111827] p-12 rounded-2xl border border-gray-800 border-dashed space-y-2">
          <p>No se encontraron requerimientos registrados visibles.</p>
          {!mostrarTerminados && listaFinal.some(item => item.status?.toLowerCase() === "terminado") && (
            <p className="text-xs text-indigo-400 font-normal">
              💡 Hay tareas resueltas ocultas. Hacé clic en el botón <b>"Ver Terminados"</b> arriba para listarlas.
            </p>
          )}
          {(perfil?.role === "admin" || perfil?.role === "developer") && listaFinal.length === 0 && (
            <p className="text-xs text-indigo-400 font-normal">
              💡 Tu usuario administrador no tiene empresas vinculadas. Ve a la <Link href="/admin?tab=accesos" className="underline font-bold text-indigo-300">Consola Admin (pestaña Asignar Empresas)</Link> y asóciate a las entidades que quieras monitorear.
            </p>
          )}
        </div>
      ) : (
        <div className="bg-[#111827] rounded-2xl border border-gray-800/60 overflow-hidden shadow-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1F2937]/50 text-gray-400 font-semibold text-xs uppercase tracking-wider border-b border-gray-800/80">
                <th className="p-4 pl-6">Fecha y Hora</th>
                <th className="p-4">Cliente / Empresa</th>
                <th className="p-4">Ingresado por</th>
                <th className="p-4">Descripción de la Necesidad</th>
                <th className="p-4">Estado</th>
                <th className="p-4 pr-6 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {registrosFiltrados.map((item: any) => {
                const fechaObj = new Date(item.date);
                const fechaFormateada = fechaObj.toLocaleDateString('es-AR');
                const horaFormateada = fechaObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });

                return (
                  <tr key={item.id} className="hover:bg-[#1F2937]/30 transition-colors">
                    <td className="p-4 pl-6 text-sm text-gray-400 font-medium">
                      <div>{fechaFormateada}</div>
                      <div className="text-xs text-gray-500 font-normal">{horaFormateada} hs</div>
                    </td>
                    <td className="p-4 font-semibold text-gray-200">{item.clients?.name || 'Sin cliente'}</td>
                    <td className="p-4 text-sm text-gray-300 font-medium">
                      {item.profiles?.full_name || 'Usuario desconocido'}
                    </td>
                    <td className="p-4 text-gray-400 max-w-xs truncate text-sm">{item.description}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${
                        item.status?.toLowerCase() === 'recibida' ? 'bg-blue-950/60 text-blue-400 border border-blue-900/50' :
                        item.status?.toLowerCase() === 'en proceso' ? 'bg-yellow-950/60 text-yellow-400 border border-yellow-900/50' :
                        item.status?.toLowerCase() === 'terminado' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/50' :
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
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}






