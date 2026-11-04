'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
// Importamos el cliente nativo oficial de tu carpeta lib
import { createClient } from '../../../lib/supabase/client'; 

function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const supabase = createClient();

      // 1. Iniciamos sesión. Las cookies se gestionan automáticamente en segundo plano.
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setErrorMsg(authError.message === "Invalid login credentials" ? "Contraseña o correo incorrectos" : authError.message);
        setLoading(false);
        return;
      }

      // 2. 🚀 REDIRECCIÓN DIRECTA: Mandamos a todos al Dashboard unificado en /protected
      // Como tu /protected ya lee el rol desde el Servidor, el enrutamiento será instantáneo y seguro.
      router.push('/protected');
      router.refresh();
      
    } catch (err: any) {
      setErrorMsg('Error de comunicación con el sistema de autenticación.');
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md w-full bg-[#111827] rounded-2xl border border-gray-800/80 p-8 shadow-2xl space-y-6">
      <div className="text-center">
        <Link href="/" className="text-xs text-indigo-400 hover:underline inline-block mb-3">
          ← Volver al inicio
        </Link>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          ControlApp MWS ⚡
        </h1>
        <p className="text-xs text-gray-400 mt-1">Ingresa con tus credenciales de acceso</p>
      </div>

      {errorMsg && (
        <div className="bg-red-950/40 border border-red-900/50 text-red-400 text-xs p-3 rounded-xl text-center break-all">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Correo</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            className="w-full p-3 border rounded-xl bg-[#1F2937] border-gray-800 text-gray-200 text-sm focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            className="w-full p-3 border rounded-xl bg-[#1F2937] border-gray-800 text-gray-200 text-sm focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl text-sm"
        >
          {loading ? 'Iniciando sesión...' : 'Entrar al Sistema'}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 flex flex-col items-center justify-center p-6 font-sans">
      <Suspense fallback={<div>Cargando...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}










