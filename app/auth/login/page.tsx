import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

// 💡 ESTA LÍNEA SOLUCIONA EL ERROR AL INSTANTE:
export const instant = false;

interface Props {
  searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams;
  const errorParam = resolvedSearchParams?.error || null;

  // 🔐 Server Action integrado para procesar el Login y el enrutamiento por rol
  async function iniciarSesion(formData: FormData) {
    'use server';

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const supabase = await createClient();

    // 1. Intentar iniciar sesión en Supabase con correo y contraseña
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return redirect(`/auth/login?error=${encodeURIComponent(authError?.message || 'Error al ingresar')}`);
    }

    // 2. Consultar el rol del usuario autenticado en la tabla profiles
    const { data: perfil } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .single();

    // 3. Redirección inteligente basada en el nivel de acceso (Rol)
    if (perfil?.role === 'developer' || perfil?.role === 'admin') {
      return redirect('/dashboard');
    } else {
      return redirect('/necesidades/nueva');
    }
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-[#111827] rounded-2xl border border-gray-800/80 p-8 shadow-2xl shadow-black/50 space-y-6">
        
        <div className="text-center">
          <Link href="/" className="text-xs text-indigo-400 hover:underline inline-block mb-3">
            ← Volver al inicio
          </Link>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Iniciar Sesión
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Ingresa tus credenciales para acceder a ControlApp MWS
          </p>
        </div>

        {errorParam && (
          <div className="bg-red-950/40 border border-red-900/50 text-red-400 text-xs p-3 rounded-xl text-center">
            {errorParam}
          </div>
        )}

        <form action={iniciarSesion} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              Correo Electrónico
            </label>
            <input
              type="email"
              name="email"
              placeholder="tu@correo.com"
              required
              className="w-full p-3 border rounded-xl bg-[#1F2937] border-gray-800 text-gray-200 text-sm placeholder-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              Contraseña
            </label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              required
              className="w-full p-3 border rounded-xl bg-[#1F2937] border-gray-800 text-gray-200 text-sm placeholder-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-50 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98] mt-4 text-sm"
          >
            Entrar
          </button>
        </form>

        <div className="border-t border-gray-800/50 my-2"></div>

        <p className="text-center text-xs text-gray-500">
          Acceso restringido para personal técnico y clientes autorizados.
        </p>

      </div>
    </div>
  );
}

