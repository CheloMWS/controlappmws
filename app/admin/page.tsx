import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export const instant = false;

export default async function AdminPanelPage({ searchParams }: { searchParams: any }) {
  const supabase = await createClient();

  // 1. 🔒 VALIDACIÓN DE SEGURIDAD (Solo administradores)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect('/auth/login');

  const { data: perfil } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (perfil?.role !== 'admin') return redirect('/dashboard');

  // 2. DETECTAR PESTAÑA ACTIVA EN LA URL
  const resolvedParams = await searchParams;
  const tab = resolvedParams?.tab || 'empresas';

  // 3. CONSULTAR DATOS BASE DESDE SUPABASE
  const { data: empresas } = await supabase.from('clients').select('*').order('name');
  const { data: usuarios } = await supabase.from('profiles').select('*').order('full_name');
  
  const { data: asignaciones } = await supabase
    .from('client_users')
    .select('id, user_id, client_id, profiles(full_name), clients(name)');

  // ⚡ SERVER ACTIONS: PROCESAMIENTO SEGURO EN EL SERVIDOR
  async function crearEmpresa(formData: FormData) {
    'use server';
    const name = formData.get('name') as string;
    const clientSupabase = await createClient();
    await clientSupabase.from('clients').insert({ name });
    revalidatePath('/admin');
  }

  // 📁 MODIFICACIÓN DE EMPRESA EXISTENTE
  async function modificarEmpresa(formData: FormData) {
    'use server';
    const id = formData.get('client_id') as string;
    const nuevoNombre = formData.get('name') as string;
    const clientSupabase = await createClient();
    await clientSupabase.from('clients').update({ name: nuevoNombre }).eq('id', parseInt(id));
    revalidatePath('/admin');
  }

  // 👑 ALTA DE USUARIOS NUEVOS (Seguridad + Base de Datos)
  async function crearUsuarioNuevo(formData: FormData) {
    'use server';
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const full_name = formData.get('full_name') as string;
    const role = formData.get('role') as string;

    const clientSupabase = await createClient();
    
    // Registra al usuario en Supabase Auth de forma segura
    const { data: authData, error: authError } = await clientSupabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name } // Pasa el nombre a la metadata pública
      }
    });

    if (!authError && authData.user) {
      // Forzamos la actualización inmediata del rol y nombre en profiles
      await clientSupabase
        .from('profiles')
        .update({ full_name, role })
        .eq('id', authData.user.id);
    }
    revalidatePath('/admin');
  }

  // ✏️ MODIFICACIÓN DE DATOS DE USUARIO EXISTENTE
  async function modificarUsuario(formData: FormData) {
    'use server';
    const userId = formData.get('user_id') as string;
    const nuevoNombre = formData.get('full_name') as string;
    const nuevoRol = formData.get('role') as string;
    
    const clientSupabase = await createClient();
    await clientSupabase
      .from('profiles')
      .update({ full_name: nuevoNombre, role: nuevoRol })
      .eq('id', userId);
    revalidatePath('/admin');
  }

  async function asignarUsuarioAEmpresa(formData: FormData) {
    'use server';
    const userId = formData.get('user_id') as string;
    const clientId = formData.get('client_id') as string;
    const clientSupabase = await createClient();
    await clientSupabase.from('client_users').insert({
      user_id: userId,
      client_id: parseInt(clientId)
    });
    revalidatePath('/admin');
  }

  async function eliminarAsignacion(formData: FormData) {
    'use server';
    const idAsignacion = formData.get('id') as string;
    const clientSupabase = await createClient();
    await clientSupabase.from('client_users').delete().eq('id', parseInt(idAsignacion));
    revalidatePath('/admin');
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 p-6 font-sans">
      <div className="max-w-5xl mx-auto mt-6">
        
        {/* Encabezado Principal */}
        <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-5">
          <div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Panel de Administración General
            </h1>
            <p className="text-sm text-gray-400 mt-1">Alta global de cuentas, edición de entidades y mapeos de acceso.</p>
          </div>
          <a href="/dashboard" className="text-sm text-indigo-400 hover:underline">← Ir al Dashboard</a>
        </div>

        {/* Sistema de Pestañas */}
        <div className="flex gap-2 mb-6 border-b border-gray-800/60 pb-px">
          {['empresas', 'usuarios', 'accesos'].map((t) => (
            <a
              key={t}
              href={`/admin?tab=${t}`}
              className={`px-5 py-2.5 font-semibold text-sm rounded-t-xl transition-all capitalize ${
                tab === t 
                  ? 'bg-[#111827] text-indigo-400 border-t border-x border-gray-800/80' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {t === 'accesos' ? 'Asignar Empresas' : t}
            </a>
          ))}
        </div>
        {/* 🏢 CONTENIDO PESTAÑA 1: EMPRESAS (ALTA Y MODIFICACIÓN) */}
        {tab === 'empresas' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#111827] p-6 rounded-2xl border border-gray-800/80 h-fit space-y-6">
              <div>
                <h3 className="text-lg font-bold mb-3 text-gray-200">Nueva Empresa</h3>
                <form action={crearEmpresa} className="space-y-3">
                  <input
                    type="text"
                    name="name"
                    placeholder="Nombre de la Empresa"
                    required
                    className="w-full p-3 border rounded-xl bg-[#1F2937] border-gray-800 text-gray-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg">
                    Registrar Empresa
                  </button>
                </form>
              </div>
            </div>

            <div className="md:col-span-2 bg-[#111827] p-6 rounded-2xl border border-gray-800/80">
              <h3 className="text-lg font-bold mb-4 text-gray-200">Empresas Registradas y Edición</h3>
              <div className="space-y-4">
                {empresas?.length === 0 ? (
                  <p className="text-gray-500 text-sm italic">No hay empresas registradas.</p>
                ) : (
                  empresas?.map((emp) => (
                    <form action={modificarEmpresa} key={emp.id} className="flex gap-3 items-center bg-[#1F2937]/30 p-3 rounded-xl border border-gray-800/40">
                      <input type="hidden" name="client_id" value={emp.id} />
                      <div className="text-xs text-gray-500 font-mono w-12">#{emp.id}</div>
                      <input
                        type="text"
                        name="name"
                        defaultValue={emp.name}
                        required
                        className="flex-1 p-2 border rounded-lg bg-[#1F2937] border-gray-800 text-gray-200 text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                      <button 
                        type="submit" 
                        className="bg-indigo-950 hover:bg-indigo-900 border border-indigo-800/60 text-xs font-semibold px-4 py-2 rounded-lg text-indigo-400 transition-colors"
                      >
                        Actualizar
                      </button>
                    </form>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* 👥 CONTENIDO PESTAÑA 2: USUARIOS (ALTA Y MODIFICACIÓN) */}
        {tab === 'usuarios' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Formulario para dar de Alta Cuentas Reales con Clave */}
            <div className="bg-[#111827] p-6 rounded-2xl border border-gray-800/80 h-fit">
              <h3 className="text-lg font-bold mb-1 text-gray-200">Registrar Usuario</h3>
              <p className="text-xs text-gray-400 mb-4">Crea credenciales de acceso reales en el sistema de seguridad.</p>
              
              <form action={crearUsuarioNuevo} className="space-y-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    name="full_name"
                    placeholder="Ej: Juan Pérez"
                    required
                    className="w-full p-2.5 border rounded-xl bg-[#1F2937] border-gray-800 text-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="correo@empresa.com"
                    required
                    className="w-full p-2.5 border rounded-xl bg-[#1F2937] border-gray-800 text-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Contraseña Inicial</label>
                  <input
                    type="password"
                    name="password"
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                    className="w-full p-2.5 border rounded-xl bg-[#1F2937] border-gray-800 text-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Rol Inicial</label>
                  <select 
                    name="role" 
                    required 
                    className="w-full p-2.5 text-xs border rounded-xl bg-[#1F2937] border-gray-800 text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="client">📁 CLIENTE COMÚN</option>
                    <option value="developer">🛠️ PROGRAMADOR</option>
                    <option value="admin">👑 ADMINISTRADOR</option>
                  </select>
                </div>
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 py-2.5 rounded-xl font-semibold text-xs transition-all shadow-lg mt-2">
                  Crear Cuenta de Acceso
                </button>
              </form>
            </div>

            {/* Listado y Formulario en Línea para Modificar Usuarios Existentes */}
            <div className="md:col-span-2 bg-[#111827] p-6 rounded-2xl border border-gray-800/80 space-y-4">
              <h3 className="text-lg font-bold text-gray-200 mb-1">Modificar Usuarios Existentes</h3>
              <p className="text-xs text-gray-400 mb-4">Edita los nombres o alterna los privilegios globales en tiempo real.</p>
              
              <div className="space-y-3">
                {usuarios?.map((userItem) => (
                  <form action={modificarUsuario} key={userItem.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-[#1F2937]/30 p-3 rounded-xl border border-gray-800/40">
                    <input type="hidden" name="user_id" value={userItem.id} />
                    
                    {/* Campo para reescribir el Nombre Completo */}
                    <div className="sm:col-span-6">
                      <input
                        type="text"
                        name="full_name"
                        defaultValue={userItem.full_name}
                        required
                        className="w-full p-2 border rounded-lg bg-[#1F2937] border-gray-800 text-gray-200 text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    {/* Selector de Roles */}
                    <div className="sm:col-span-4">
                      <select
                        name="role"
                        defaultValue={userItem.role}
                        className="w-full p-2 border rounded-lg bg-[#1F2937] border-gray-800 text-xs text-gray-300 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="client">📁 CLIENTE COMÚN</option>
                        <option value="developer">🛠️ PROGRAMADOR</option>
                        <option value="admin">👑 ADMINISTRADOR</option>
                      </select>
                    </div>

                    {/* Botón de envío de cambios */}
                    <div className="sm:col-span-2 text-right">
                      <button 
                        type="submit" 
                        className="w-full bg-indigo-950 hover:bg-indigo-900 border border-indigo-800/60 text-xs font-semibold py-2 rounded-lg text-indigo-400 transition-colors"
                      >
                        Guardar
                      </button>
                    </div>
                  </form>
                ))}
              </div>
            </div>
          </div>
        )}

               {/* 🔗 CONTENIDO PESTAÑA 3: MATRIZ DE ACCESOS (Multi-empresa) */}
        {tab === 'accesos' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Formulario de vinculación */}
            <div className="bg-[#111827] p-6 rounded-2xl border border-gray-800/80 h-fit">
              <h3 className="text-lg font-bold mb-2 text-gray-200">Vincular Acceso</h3>
              <p className="text-xs text-gray-400 mb-5 leading-relaxed">
                Asigna empresas autorizadas a un cliente. Puedes asociar múltiples empresas a un mismo usuario de forma ilimitada.
              </p>
              <form action={asignarUsuarioAEmpresa} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-gray-500 mb-1.5">
                    Seleccionar Usuario Cliente
                  </label>
                  <select 
                    name="user_id" 
                    required 
                    className="w-full p-3 text-xs border rounded-xl bg-[#1F2937] border-gray-800 text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Elegir cliente...</option>
                    {/* 💡 AQUÍ ESTÁ LA CORRECCIÓN: Ahora muestra TODOS los usuarios registrados de inmediato */}
                    {usuarios?.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.full_name} ({u.role ? u.role.toUpperCase() : 'SIN ROL'})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-gray-500 mb-1.5">
                    Empresa Autorizada
                  </label>
                  <select 
                    name="client_id" 
                    required 
                    className="w-full p-3 text-xs border rounded-xl bg-[#1F2937] border-gray-800 text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Elegir empresa...</option>
                    {empresas?.map(e => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </select>
                </div>
                <button 
                  type="submit" 
                  className="w-full bg-emerald-600 hover:bg-emerald-500 py-2.5 rounded-xl font-semibold text-xs tracking-medium transition-all shadow-lg shadow-emerald-600/10 active:scale-[0.98]"
                >
                  Otorgar Permiso
                </button>
              </form>
            </div>

            {/* Listado de mapeos activos */}
            <div className="md:col-span-2 bg-[#111827] p-6 rounded-2xl border border-gray-800/80">
              <h3 className="text-lg font-bold mb-4 text-gray-200">Matriz de Permisos Activos</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-800/60 font-semibold text-xs uppercase tracking-wider">
                      <th className="pb-3">Usuario Cliente</th>
                      <th className="pb-3">Empresa Relacionada</th>
                      <th className="pb-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60">
                    {asignaciones?.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-6 text-center text-sm text-gray-500 italic">
                          No hay permisos configurados todavía.
                        </td>
                      </tr>
                    ) : (
                      asignaciones?.map((asig: any) => (
                        <tr key={asig.id} className="hover:bg-[#1F2937]/10 transition-colors">
                          <td className="py-3.5 text-gray-300 font-medium">{asig.profiles?.full_name}</td>
                          <td className="py-3.5 text-indigo-400 font-semibold">{asig.clients?.name}</td>
                          <td className="py-3.5 text-right">
                            <form action={eliminarAsignacion}>
                              <input type="hidden" name="id" value={asig.id} />
                              <button 
                                type="submit" 
                                className="text-red-400 hover:text-red-300 text-xs bg-red-950/20 px-3 py-1.5 rounded-xl border border-red-900/40 transition-all active:scale-95"
                              >
                                Revocar
                              </button>
                            </form>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}


