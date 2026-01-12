import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { GoogleIcon, MicrosoftIcon, WhatsAppIcon, VersixLogo } from '../components/BrandedIcons';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
    } else {
      navigate('/');
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'azure') => {
    const { error: socialError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (socialError) {
      setError(socialError.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-display bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-200">
      {/* Header / Nav */}
      <header className="flex items-center justify-between whitespace-nowrap px-6 py-4 md:px-10 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850">
        <div className="flex items-center">
          <VersixLogo className="h-[40px] w-auto" />
        </div>
        <div className="hidden sm:flex gap-2">
          <span className="text-sm text-slate-500 dark:text-slate-400 font-medium self-center">Não tem uma conta?</span>
          <Link to="/signup" className="flex cursor-pointer items-center justify-center overflow-hidden rounded-lg h-9 px-4 bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-bold">
            Criar conta
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col md:flex-row h-full">
        {/* Left Side: Visual / Branding */}
        <div className="hidden md:flex md:w-1/2 lg:w-3/5 bg-slate-50 dark:bg-[#15202b] relative items-center justify-center overflow-hidden p-10">
          {/* Decorative Background Elements */}
          <div className="absolute inset-0 z-0">
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-100/50 dark:bg-blue-900/20 blur-[100px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px]"></div>
          </div>
          <div className="relative z-10 max-w-lg flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <h1 className="text-[#0d141b] dark:text-white tracking-tight text-4xl lg:text-5xl font-extrabold leading-[1.1]">
                Inteligência Artificial nas suas Finanças
              </h1>
              <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed">
                Conecte seu WhatsApp e deixe nossa IA organizar suas contas automaticamente enquanto você foca no crescimento do seu negócio.
              </p>
            </div>
            {/* Feature Illustration */}
            <div className="relative bg-white dark:bg-slate-850 p-6 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 w-full max-w-md self-start transform rotate-1 hover:rotate-0 transition-transform duration-500">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <WhatsAppIcon className="size-6" />
                </div>
                <div className="flex-1">
                  <div className="h-2 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-1"></div>
                  <div className="h-2 w-16 bg-slate-100 dark:bg-slate-800 rounded"></div>
                </div>
                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">Processando</span>
              </div>
              <div className="space-y-3">
                <div className="flex gap-3 items-start p-3 bg-slate-50 dark:bg-background-dark rounded-lg">
                  <span className="material-symbols-outlined text-slate-400 text-sm mt-0.5">receipt_long</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Nota Fiscal #4920</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Extraída via WhatsApp</p>
                  </div>
                  <span className="ml-auto text-sm font-bold text-slate-900 dark:text-white">R$ 1.250,00</span>
                </div>
                <div className="flex gap-3 items-start p-3 bg-slate-50 dark:bg-background-dark rounded-lg">
                  <span className="material-symbols-outlined text-slate-400 text-sm mt-0.5">savings</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Economia Sugerida</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Análise de IA</p>
                  </div>
                  <span className="ml-auto text-sm font-bold text-green-600">+12%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 bg-white dark:bg-slate-850 shadow-2xl md:shadow-none z-20">
          <div className="w-full max-w-md flex flex-col gap-6">
            <div className="text-center md:text-left">
              <h1 className="text-[#0d141b] dark:text-white tracking-tight text-3xl font-bold leading-tight mb-2">Bem-vindo de volta</h1>
              <p className="text-slate-500 dark:text-slate-400 text-base">Acesse o seu ERP financeiro inteligente.</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
              {error && (
                <div className="p-3 rounded-lg bg-red-100 border border-red-200 text-red-600 text-sm font-medium animate-shake">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-[#0d141b] dark:text-slate-200">E-mail</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[20px]">mail</span>
                  </div>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
                    placeholder="seu@email.com"
                    required
                    type="email"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-[#0d141b] dark:text-slate-200">Senha</label>
                  <Link to="/forgot-password" size="sm" className="text-sm font-medium text-primary hover:text-primary transition-colors">
                    Esqueceu sua senha?
                  </Link>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[20px]">lock</span>
                  </div>
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
                    placeholder="••••••••"
                    required
                    type={showPassword ? 'text' : 'password'}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              <button
                className={`mt-4 w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary text-white font-bold py-2.5 px-4 rounded-lg transition-all duration-200 shadow-lg shadow-primary/30 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <span>Entrar</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </>
                )}
              </button>
            </form>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
              <span className="flex-shrink-0 mx-4 text-slate-400 text-xs uppercase font-bold tracking-wider">ou continue com</span>
              <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleSocialLogin('google')}
                className="flex items-center justify-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white py-2.5 rounded-lg transition-colors font-medium text-sm"
              >
                <GoogleIcon className="w-5 h-5" />
                Google
              </button>
              <button
                onClick={() => handleSocialLogin('azure')}
                className="flex items-center justify-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white py-2.5 rounded-lg transition-colors font-medium text-sm"
              >
                <MicrosoftIcon className="w-5 h-5" />
                Microsoft
              </button>
            </div>

            {/* Mobile Only Create Account Link */}
            <div className="mt-4 text-center sm:hidden">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Não tem uma conta?
                <Link className="font-bold text-primary hover:text-primary ml-1" to="/signup">Criar conta</Link>
              </p>
            </div>

            <div className="mt-auto pt-6 flex justify-center gap-6 text-xs text-slate-400">
              <Link to="/terms" className="hover:text-slate-600 dark:hover:text-slate-200 transition-colors">Termos de Uso</Link>
              <Link to="/privacy" className="hover:text-slate-600 dark:hover:text-slate-200 transition-colors">Privacidade</Link>
              <Link to="/help" className="hover:text-slate-600 dark:hover:text-slate-200 transition-colors">Ajuda</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;