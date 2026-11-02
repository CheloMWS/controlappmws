'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
// Nos conectamos directamente al archivo que creamos recién en la carpeta lib
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

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setErrorMsg(authError.message === "Invalid login credentials" ? "Contraseña o correo incorrectos" : authError.message);
        setLoading(false);
        return;
      }

      // Esto le avisa a Next.js que la sesión es válida y te manda al panel
      router.push('/dashboard');
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
          ControlApp MWS Conectado 🚀
        </h1>
        <p className="text-xs text-gray-400 mt-1">Ingresa de forma segura a tu panel</p>
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
          {loading ? 'Validando...' : 'Entrar al Panel'}
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





