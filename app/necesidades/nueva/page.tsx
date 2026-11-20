"use client";

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export const dynamic = "force-dynamic";

export default function NuevaNecesidadPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  const [supabase, setSupabase] = useState<any>(null);

  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const [description, setDescription] = useState('');
  const [clientId, setClientId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setSupabase(createClient());
  }, []);

  useEffect(() => {
    if (!supabase) return;

    async function inicializarFormulario() {
      try {
        const { data: { user: activeUser } } = await supabase.auth.getUser();
        
        if (!activeUser) {
          router.push('/auth/login');
          return;
        }
        setUser(activeUser);

        // 1. Buscamos exclusivamente los IDs de empresas asignadas al usuario en client_users
        const { data: mapeos, error: mapError } = await supabase
          .from('client_users')
          .select('client_id')
          .eq('user_id', activeUser.id);

        if (mapError) {
          console.error("Error al obtener asignaciones en client_users:", mapError.message);
          setClientes([]);
          return;
        }

        const idsAsignados = mapeos?.map((m: any) => m.client_id) || [];

        // 2. Si tiene empresas asignadas, traemos sus datos ordenados por nombre
        if (idsAsignados.length > 0) {
          const { data: empresasFinales, error: clientError } = await supabase
            .from('clients')
            .select('id, name')
            .in('id', idsAsignados)
            .order('name');

          if (clientError) {
            console.error("Error al obtener detalles de empresas:", clientError.message);
            setClientes([]);
          } else {
            setClientes(empresasFinales || []);
          }
        } else {
          setClientes([]);
        }
      } catch (err) {
        console.error("Error crítico al cargar empresas:", err);
        setClientes([]);
      } finally {
        setLoading(false);
      }
    }

    inicializarFormulario();
  }, [router, supabase]);

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
            console.error("❌ Error crítico en Supabase Storage:", storageError.message, storageError);
            setErrorMsg(`Error al subir la imagen: ${storageError.message}`);
            return;
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
              disabled={isPending || clientes.length === 0}
              className="w-full p-3 border rounded-xl bg-[#1F2937] border-gray-800 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
            >
              <option value="">
                {clientes.length === 0 ? 'No tienes empresas asignadas' : 'Selecciona un cliente'}
              </option>
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
            disabled={isPending || clientes.length === 0}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl text-sm mt-2 transition-all"
          >
            {isPending ? 'Enviando requerimiento...' : 'Enviar Requerimiento'}
          </button>
        </form>
      </div>
    </div>
  );
}

