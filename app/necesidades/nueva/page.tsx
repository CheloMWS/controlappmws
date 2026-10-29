import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const instant = false;

export default async function NuevaNecesidadPage() {
  const supabase = await createClient();

  // 🔒 BLOQUEO DE SEGURIDAD: Verifica si el usuario inició sesión
  const { data: { user } } = await supabase.auth.getUser();
  
  // Si no hay usuario logueado, redirige a la pantalla de login nativa
  if (!user) {
    return redirect('/login'); 
  }

  // 1. Obtener los clientes (gracias al RLS, solo verá los permitidos)
  const { data: clientes } = await supabase
    .from('clients')
    .select('id, name');

  // Server Action para procesar el formulario de forma segura en el servidor
  async function registrarNecesidad(formData: FormData) {
    'use server';
    const supabaseAction = await createClient();
    
    // Doble verificación de usuario antes de insertar datos
    const { data: { user: activeUser } } = await supabaseAction.auth.getUser();
    if (!activeUser) return redirect('/login');

    const clientId = formData.get('client_id') as string;
    const description = formData.get('description') as string;
    const file = formData.get('image') as File;
    
    let imageUrl = null;
    let fileName = null;

    if (file && file.size > 0) {
      fileName = `${Date.now()}_${file.name}`;
      const { data: storageData, error: storageError } = await supabaseAction
        .storage
        .from('need-attachments')
        .upload(fileName, file);

      if (!storageError && storageData) {
        const { data: urlData } = supabaseAction
          .storage
          .from('need-attachments')
          .getPublicUrl(fileName);
        imageUrl = urlData.publicUrl;
      }
    }

    await supabaseAction
      .from('needs')
      .insert({
        client_id: parseInt(clientId),
        created_by: activeUser.id,
        description: description,
        file_name: fileName,
        image_url: imageUrl,
        status: 'recibida'
      });

    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 p-6 flex items-center justify-center">
      <div className="max-w-md w-full bg-[#111827] rounded-2xl border border-gray-800/80 p-8 shadow-2xl shadow-black/50">
        <Link href="/dashboard" className="text-xs text-indigo-400 hover:underline">← Volver al Dashboard</Link>
        <h1 className="text-2xl font-bold mt-3 mb-6 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          Reportar Nueva Necesidad
        </h1>
        
        <form action={registrarNecesidad} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Cliente / Empresa</label>
            <select 
              name="client_id" 
              required 
              className="w-full p-3 border rounded-xl bg-[#1F2937] border-gray-800 text-gray-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            >
              <option value="">Selecciona un cliente</option>
              {clientes?.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>{cliente.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Descripción de la necesidad</label>
            <textarea
              name="description"
              required
              rows={4}
              placeholder="Describe detalladamente qué se necesita..."
              className="w-full p-3 border rounded-xl bg-[#1F2937] border-gray-800 text-gray-200 text-sm placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Adjuntar Imagen (Evidencia)</label>
            <input
              type="file"
              name="image"
              accept="image/*"
              className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-950 file:text-indigo-400 file:border-indigo-900 hover:file:bg-indigo-900 transition-all cursor-pointer"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98] mt-2 text-sm"
          >
            Enviar Requerimiento
          </button>
        </form>
      </div>
    </div>
  );
}
