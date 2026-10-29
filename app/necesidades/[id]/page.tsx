import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const instant = false;

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DetalleNecesidadPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: necesidad, error: errorNeed } = await supabase
    .from('needs')
    .select('*, clients(name)')
    .eq('id', id)
    .single();

  if (errorNeed || !necesidad) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-gray-100 flex flex-col items-center justify-center p-6">
        <p className="text-red-400 font-semibold mb-4 bg-red-950/30 border border-red-900/50 px-6 py-3 rounded-xl">Requerimiento no encontrado.</p>
        <Link href="/dashboard" className="text-indigo-400 hover:underline text-sm">Volver al Dashboard</Link>
      </div>
    );
  }

  const { data: atenciones } = await supabase
    .from('attentions')
    .select('*, profiles(full_name)')
    .eq('need_id', id)
    .order('attention_date', { ascending: false });

  async function agregarAtencion(formData: FormData) {
    'use server';
    const supabaseAction = await createClient();
    const { data: { user } } = await supabaseAction.auth.getUser();
    if (!user) return redirect('/login');

    const nuevoEstado = formData.get('status') as string;
    const comentario = formData.get('action_taken') as string;

    await supabaseAction.from('needs').update({ status: nuevoEstado }).eq('id', id);
    await supabaseAction.from('attentions').insert({
      need_id: parseInt(id),
      developer_id: user.id,
      action_taken: comentario
    });

    redirect(`/necesidades/${id}`);
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 p-6 font-sans">
      <div className="max-w-5xl mx-auto mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Sección de Datos Históricos e Información */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-[#111827] p-6 rounded-2xl border border-gray-800/80 shadow-xl">
            <Link href="/dashboard" className="text-xs text-indigo-400 hover:underline">← Volver al Dashboard</Link>
            <h1 className="text-2xl font-bold mt-3 mb-1 text-gray-100">Requerimiento #{necesidad.id}</h1>
            <p className="text-xs text-gray-400 mb-4">Empresa: <span className="font-semibold text-indigo-400">{necesidad.clients?.name}</span></p>
            
            <div className="bg-[#1F2937]/50 p-4 rounded-xl border border-gray-800/60 mb-5">
              <h3 className="font-bold text-[10px] text-gray-500 uppercase tracking-widest mb-2">Descripción del Requerimiento:</h3>
              <p className="whitespace-pre-line text-sm text-gray-300 leading-relaxed">{necesidad.description}</p>
            </div>

            {necesidad.image_url && (
              <div>
                <h3 className="font-bold text-[10px] text-gray-500 uppercase tracking-widest mb-2">Evidencia Adjunta:</h3>
                <a href={necesidad.image_url} target="_blank" rel="noreferrer" className="block w-fit">
                  <img src={necesidad.image_url} alt="Evidencia" className="max-h-72 object-contain rounded-xl border border-gray-800 bg-[#0B0F19] hover:opacity-90 transition-opacity" />
                </a>
              </div>
            )}
          </div>

          {/* Historial con Estilo Línea de Tiempo */}
          <div className="bg-[#111827] p-6 rounded-2xl border border-gray-800/80 shadow-xl">
            <h2 className="text-xl font-bold mb-6 bg-gradient-to-r from-gray-100 to-gray-400 bg-clip-text text-transparent">Historial de Atenciones</h2>
            {atenciones?.length === 0 ? (
              <p className="text-gray-500 text-sm italic bg-[#1F2937]/30 p-6 rounded-xl border border-dashed border-gray-800 text-center">
                Ningún programador ha atendido este requerimiento todavía.
              </p>
            ) : (
              <div className="space-y-6 relative border-l border-gray-800 pl-6 ml-2">
                {atenciones?.map((atencion) => (
                  <div key={atencion.id} className="relative">
                    <div className="absolute -left-[31px] mt-1.5 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-[#111827]" />
                    <p className="text-[11px] text-gray-500 font-medium">
                      {new Date(atencion.attention_date).toLocaleDateString('es-AR', {
                        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false
                      })} hs - Por: <span className="font-semibold text-gray-300">{atencion.profiles?.full_name}</span>
                    </p>
                    <p className="text-sm text-gray-400 mt-1.5 bg-[#1F2937]/40 p-3 rounded-xl border border-gray-800/50 whitespace-pre-line">
                      {atencion.action_taken}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Panel de Gestión a la Derecha */}
        <div className="bg-[#111827] p-6 rounded-2xl border border-gray-800/80 shadow-xl h-fit">
          <h2 className="text-lg font-bold mb-4 border-b border-gray-800 pb-2 text-gray-200">Gestionar</h2>
          
          <form action={agregarAtencion} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Estado de la Necesidad</label>
              <select 
                name="status" 
                defaultValue={necesidad.status}
                className="w-full p-2.5 border rounded-xl bg-[#1F2937] border-gray-800 font-semibold text-sm text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="recibida">🔵 RECIBIDA</option>
                <option value="sin analizar">🟣 SIN ANALIZAR</option>
                <option value="analizada">🔵 ANALIZADA</option>
                <option value="en proceso">🟡 EN PROCESO</option>
                <option value="terminado">🟢 TERMINADO</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">¿Qué se hizo? (Bitácora)</label>
              <textarea
                name="action_taken"
                required
                rows={5}
                placeholder="Detalla los avances técnicos o la solución..."
                className="w-full p-3 text-sm border rounded-xl bg-[#1F2937] border-gray-800 text-gray-300 placeholder-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-4 rounded-xl transition-all text-sm shadow-lg shadow-emerald-950/20 active:scale-[0.98]"
            >
              Registrar Avance
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
