import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ProtectedPage() {
  const supabase = await createClient();

  // 1. Verificamos el usuario activo en la sesión del servidor
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/auth/login");

  // 2. Traemos su perfil real para evaluar privilegios
  const { data: perfil } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // 3. Matriz de accesos: Consultamos los IDs de empresas asignadas
  const { data: relaciones } = await supabase
    .from("client_users")
    .select("client_id")
    .eq("user_id", user.id);

  const idsAsignados = relaciones?.map((r) => r.client_id) || [];

  let listaFinal: any[] = [];

  // Definimos los campos que queremos traer de las relaciones, usando full_name de profiles
  const camposSelect = "id, description, status, date, clients(name), profiles:created_by(full_name)";

  // 🚀 REGLA DE FILTRADO SEGURO
  if (perfil?.role === "admin" || perfil?.role === "developer") {
    // Administrador: Si tiene mapeos consulta por ellos, de lo contrario muestra vacío
    if (idsAsignados.length > 0) {
      const { data } = await supabase
        .from("needs")
        .select(camposSelect)
        .in("client_id", idsAsignados)
        .order("date", { ascending: false });
      listaFinal = data || [];
    }
  } else {
    // Cliente Común: Consulta limpia trayendo lo que tiene permitido O lo que creó manualmente
    let queryCliente = supabase
      .from("needs")
      .select(camposSelect);

    if (idsAsignados.length > 0) {
      const { data } = await queryCliente
        .or(`client_id.in.(${idsAsignados.join(",")}),created_by.eq.${user.id}`)
        .order("date", { ascending: false });
      listaFinal = data || [];
    } else {
      const { data } = await queryCliente
        .eq("created_by", user.id)
        .order("date", { ascending: false });
      listaFinal = data || [];
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <header className="border-b border-gray-800 pb-4 flex justify-between items-center">
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
        <Link href="/necesidades/nueva" className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2.5 px-4 rounded-xl transition-all shadow-md">
          ➕ Nueva Solicitud
        </Link>
      </header>

      {listaFinal.length === 0 ? (
        <div className="text-center text-sm text-gray-500 italic bg-[#111827] p-12 rounded-2xl border border-gray-800 border-dashed space-y-2">
          <p>No se encontraron requerimientos registrados para tus empresas autorizadas.</p>
          {(perfil?.role === "admin" || perfil?.role === "developer") && (
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
              {listaFinal.map((item: any) => {
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
                        item.status === 'recibida' ? 'bg-blue-950/60 text-blue-400 border border-blue-900/50' :
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
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}





