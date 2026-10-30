import Link from 'next/link';
export const instant = false;
export default async function Index() {
  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 flex flex-col items-center justify-center p-6 font-sans">
      
      {/* Contenedor Principal Estilizado */}
      <div className="max-w-md w-full bg-[#111827] rounded-2xl border border-gray-800/80 p-10 shadow-2xl shadow-black/60 text-center space-y-8">
        
        {/* Logo o Icono del Sistema */}
        <div className="mx-auto w-16 h-16 bg-indigo-600/10 border border-indigo-500/30 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/5">
          <svg xmlns="http://w3.org" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-indigo-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2Z" />
          </svg>
        </div>

        {/* Título de la Aplicación */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            ControlApp MWS
          </h1>
          <p className="text-sm text-gray-400 mt-2">
            Sistema de Gestión y Trazabilidad de Requerimientos Técnicos.
          </p>
        </div>
        
        {/* Separador sutil */}
        <div className="border-t border-gray-800/60 my-2"></div>

        {/* Botón de Acción Principal Claro */}
        <div className="space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
            Para continuar, inicia sesión
          </p>
          <Link 
            href="/auth/login" 
            className="block w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 px-4 rounded-xl transition-all duration-200 shadow-lg shadow-indigo-600/20 active:scale-[0.98] text-base tracking-medium"
          >
            Ingresar al Sistema →
          </Link>
        </div>

        {/* Pie de página informativo */}
        <p className="text-[11px] text-gray-600">
          Acceso exclusivo para personal autorizado, clientes y programadores.
        </p>

      </div>
    </div>
  );
}
