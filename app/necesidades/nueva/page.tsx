"use client";

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export const dynamic = "force-dynamic";

export default function NuevaNecesidadPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  // 🟢 CORRECCIÓN: Inicializamos supabase como un estado para proteger el servidor
  const [supabase, setSupabase] = useState<any>(null);

  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const [description, setDescription] = useState('');
  const [clientId, setClientId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // 🟢 CORRECCIÓN: Creamos el cliente de Supabase únicamente en el navegador
  useEffect(() => {
    setSupabase(createClient());
  }, []);

  // 🔍 CARGA INTELIGENTE DE DATOS DESDE EL NAVEGADOR
  useEffect(() => {
    // Si supabase aún no se ha inicializado, esperamos
    if (!supabase) return;

    async function inicializarFormulario() {
      try {
        const { data: { user: activeUser } } = await supabase.auth.getUser();
        
        if (!activeUser) {
          router.push('/auth/login');
          return;
        }
        setUser(activeUser);

        // Consultamos el rol real del perfil
        const { data: perfil, error: perfilError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', activeUser.id)
          .single();

        if (perfilError) {
          console.error("Error al obtener perfil:", perfilError.message);
        }

        if (perfil?.role === 'admin' || perfil?.role === 'developer') {
          // Administrador: Trae absolutamente todas las empresas globales
          const { data: globales, error: globalError } = await supabase
            .from('clients')
            .select('id, name')
            .order('name');
          
          if (globalError) console.error("Error RLS/Fetch Admin:", globalError.message);
          setClientes(globales || []);
        } else {
          // Cliente Común: Traemos las empresas haciendo un JOIN directo en una sola consulta
          const { data: mapeos, error: clientError } = await supabase
            .from('client_users')
            .select(`
              client_id,
              clients (
                id,
                name
              )
            `)
            .eq('user_id', activeUser.id);

          if (clientError) {
            console.error("Error RLS/Fetch Client (revisar políticas):", clientError.message);
          }

          // Transformamos el formato del JOIN a una lista plana de empresas válidas
          const empresasAsignadas = mapeos
            ?.map((m: any) => m.clients)
            .filter((c: any) => c !== null) || [];

          // SI EL JOIN ANTERIOR FALLA POR FALTA DE RELACIÓN FORMAL, RESPALDO USANDO TU LÓGICA ORIGINAL CON LOGS DE ERROR:
          if (empresasAsignadas.length === 0 && mapeos && mapeos.length > 0) {
            const idsPlanos = mapeos.map((m: any) => m.client_id);
            const { data: empresasFinales, error: backupError } = await supabase
              .from('clients')
              .select('id, name')
              .in('id', idsPlanos)
              .order('name');
            
            if (backupError) console.error("Error en consulta de respaldo:", backupError.message);
            setClientes(empresasFinales || []);
          } else {
            setClientes(empresasAsignadas);
          }
        }
      } catch (err) {
        console.error("Error crítico al cargar empresas:", err);
      } finally {
        setLoading(false);
      }
    }

    inicializarFormulario();
  }, [router, supabase]); // Añadimos supabase a las dependencias


  // 💾 PROCESAMIENTO SEGURO DE REGISTRO
  async function handleEnviarRequerimiento(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId || !description.trim() || !user) return;
    
    setErrorMsg('');
    
    startTransition(async () => {
      try {
        const targetElement = e.target as HTMLFormElement;
        const fileInput = targetElement.querySelector('input[type="file"]') as HTMLInputElement;
        const file = fileInput?.files?.[0];

        let imageUrl = null;
        let fileName = null;

        if (file && file.size > 0) {
          fileName = `${Date.now()}_${file.name}`;
          
          const { data: storageData, error: storageError } = await supabase
            .storage
            .from('need-attachments')
            .upload(fileName, file);

          if (storageError) {
            // Esto te va a mostrar el error exacto en la consola del navegador
            console.error("❌ Error crítico en Supabase Storage:", storageError.message, storageError);
            setErrorMsg(`Error al subir la imagen: ${storageError.message}`);
            return; // Frenamos la ejecución para que no inserte datos rotos
          }

          if (storageData) {
            const { data: urlData } = supabase
              .storage
              .from('need-attachments')
              .getPublicUrl(fileName);
            imageUrl = urlData.publicUrl;
          }
        }

        const { error: insertError } = await supabase
          .from('needs')
          .insert({
            client_id: parseInt(clientId),
            created_by: user.id,
            description: description,
            file_name: fileName,
            image_url: imageUrl,
            status: 'recibida'
          });

        if (insertError) {
          console.error("Error al insertar necesidad:", insertError.message);
          setErrorMsg('No tienes permisos suficientes para registrar en esta empresa.');
          return;
        }

        router.push('/protected');
        router.refresh();

      } catch (err) {
        setErrorMsg('Error de comunicación con la base de datos.');
      }
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-gray-400 flex items-center justify-center font-mono text-xs">
        Sincronizando empresas autorizadas...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 p-6 flex items-center justify-center">
      <div className="max-w-md w-full bg-[#111827] rounded-2xl border border-gray-800/80 p-8 shadow-2xl">
        <Link href="/protected" className="text-xs text-indigo-400 hover:underline">← Volver al Panel</Link>
        <h1 className="text-2xl font-bold mt-3 mb-6 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          Reportar Nueva Necesidad
        </h1>

        {errorMsg && (
          <div className="bg-red-950/40 border border-red-900/50 text-red-400 text-xs p-3 rounded-xl text-center mb-4">
            {errorMsg}
          </div>
        )}
        
        <form onSubmit={handleEnviarRequerimiento} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Cliente / Empresa</label>
            <select 
              name="client_id"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              required 
              disabled={isPending}
              className="w-full p-3 border rounded-xl bg-[#1F2937] border-gray-800 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="">Selecciona un cliente</option>
              {clientes.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Descripción de la necesidad</label>
            <textarea
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              disabled={isPending}
              placeholder="Describe detalladamente qué se necesita..."
              className="w-full p-3 border rounded-xl bg-[#1F2937] border-gray-800 text-gray-200 text-sm placeholder-gray-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Adjuntar Imagen</label>
            <input
              type="file"
              name="image"
              accept="image/*"
              disabled={isPending}
              className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-950 file:text-indigo-400 cursor-pointer"
            />
          </div>

          <button 
            type="submit" 
            disabled={isPending}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-4 rounded-xl text-sm mt-2 transition-all"
          >
            {isPending ? 'Enviando requerimiento...' : 'Enviar Requerimiento'}
          </button>
        </form>
      </div>
    </div>
  );
}
