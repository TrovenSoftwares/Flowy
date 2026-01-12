import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { GoogleIcon, MicrosoftIcon, VersixLogo } from '../components/BrandedIcons';

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validatePassword = (pass: string) => {
    const hasLowercase = /[a-z]/.test(pass);
    const hasUppercase = /[A-Z]/.test(pass);
    const hasNumber = /\d/.test(pass);
    const hasSymbol = /[@$!%*?&]/.test(pass);
    const isLongEnough = pass.length >= 8;

    return {
      hasLowercase,
      hasUppercase,
      hasNumber,
      hasSymbol,
      isLongEnough,
      isValid: hasLowercase && hasUppercase && hasNumber && hasSymbol && isLongEnough
    };
  };

  const passwordStatus = validatePassword(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordStatus.isValid) {
      setError('A senha deve ter pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas, números e símbolos.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    setError(null);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
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
    <div className="min-h-screen flex w-full font-display antialiased text-slate-900 bg-background-light dark:bg-background-dark dark:text-slate-100">
      {/* Left Section: Form */}
      <div className="flex-1 flex flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24 bg-white dark:bg-slate-900 z-10 w-full lg:w-[45%] xl:w-[40%]">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          {/* Header with Logo */}
          <div className="mb-10">
            <div className="flex items-center gap-3 text-slate-900 dark:text-white mb-6">
              <VersixLogo className="h-[55px] w-auto" />
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Crie sua conta
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Comece a automatizar suas finanças em minutos.
            </p>
          </div>

          <div className="mt-8">
            {/* Social Login */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleSocialLogin('google')}
                className="w-full inline-flex justify-center py-2.5 px-4 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <span className="sr-only">Sign in with Google</span>
                <GoogleIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => handleSocialLogin('azure')}
                className="w-full inline-flex justify-center py-2.5 px-4 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <span className="sr-only">Sign in with Microsoft</span>
                <MicrosoftIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Divider */}
            <div className="relative mt-6">
              <div aria-hidden="true" className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400">Ou continue com email</span>
              </div>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              {error && (
                <div className="p-3 rounded-lg bg-red-100 border border-red-200 text-red-600 text-sm font-medium">
                  {error}
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-slate-200 mb-1.5" htmlFor="name">
                  Nome Completo
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[20px]">person</span>
                  </div>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full rounded-lg border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-10 py-3 text-slate-900 dark:text-white placeholder-slate-400 focus:border-primary focus:ring-primary sm:text-sm outline-none transition-all"
                    id="name"
                    placeholder="Ex: João Silva"
                    required
                    type="text"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-slate-200 mb-1.5" htmlFor="email">
                  Email Corporativo
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[20px]">mail</span>
                  </div>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-lg border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-10 py-3 text-slate-900 dark:text-white placeholder-slate-400 focus:border-primary focus:ring-primary sm:text-sm outline-none transition-all"
                    id="email"
                    placeholder="nome@empresa.com"
                    required
                    type="email"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password Group */}
              <div className="grid grid-cols-1 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-slate-200 mb-1.5" htmlFor="password">
                    Senha
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[20px]">lock</span>
                    </div>
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full rounded-lg border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-10 pr-10 py-3 text-slate-900 dark:text-white placeholder-slate-400 focus:border-primary focus:ring-primary sm:text-sm outline-none transition-all"
                      id="password"
                      placeholder="********"
                      required
                      type={showPassword ? 'text' : 'password'}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                  {/* Strength Meter */}
                  <div className="mt-2 flex gap-1 h-1">
                    <div className={`flex-1 rounded-full transition-colors ${passwordStatus.isLongEnough ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                    <div className={`flex-1 rounded-full transition-colors ${passwordStatus.hasLowercase && passwordStatus.hasUppercase ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                    <div className={`flex-1 rounded-full transition-colors ${passwordStatus.hasNumber ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                    <div className={`flex-1 rounded-full transition-colors ${passwordStatus.hasSymbol ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                  </div>
                  <div className="mt-2 space-y-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Requisitos da senha:</p>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                      <RequirementItem met={passwordStatus.isLongEnough} label="8+ caracteres" />
                      <RequirementItem met={passwordStatus.hasUppercase} label="Letra maiúscula" />
                      <RequirementItem met={passwordStatus.hasLowercase} label="Letra minúscula" />
                      <RequirementItem met={passwordStatus.hasNumber} label="Número" />
                      <RequirementItem met={passwordStatus.hasSymbol} label="Símbolo (@$!%*?&)" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-slate-200 mb-1.5" htmlFor="confirm-password">
                    Confirmar Senha
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[20px]">lock_reset</span>
                    </div>
                    <input
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full rounded-lg border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-10 pr-10 py-3 text-slate-900 dark:text-white placeholder-slate-400 focus:border-primary focus:ring-primary sm:text-sm outline-none transition-all"
                      id="confirm-password"
                      placeholder="********"
                      required
                      type={showPassword ? 'text' : 'password'}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start">
                <div className="flex h-5 items-center">
                  <input className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary dark:border-slate-700 dark:bg-slate-800 dark:ring-offset-slate-900 cursor-pointer" id="terms" name="terms" required type="checkbox" />
                </div>
                <div className="ml-3 text-sm">
                  <label className="font-medium text-slate-700 dark:text-slate-300 cursor-pointer" htmlFor="terms">
                    Aceito os <Link to="/terms" className="text-primary hover:underline">Termos de Serviço</Link> e <Link to="/privacy" className="text-primary hover:underline">Política de Privacidade</Link>.
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  className={`group relative flex w-full justify-center rounded-lg border border-transparent bg-primary py-3 px-4 text-sm font-bold text-white hover:bg-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all shadow-lg shadow-primary/30 active:scale-95 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <span className="material-symbols-outlined text-white/70 group-hover:text-white transition-colors">arrow_forward</span>
                      </span>
                      Criar minha conta
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Footer Sign In Link */}
            <div className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
              <p>Já tem uma conta? <Link className="font-semibold text-primary hover:text-primary transition-colors" to="/login">Fazer login</Link></p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section: Visual/Marketing */}
      <div className="hidden lg:block relative flex-1 bg-slate-50 dark:bg-slate-900">
        <div
          className="absolute inset-0 h-full w-full object-cover bg-slate-900"
          style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCyRtcazmotwrPGIHPb3znlm1eYT18N9I2V5ndBy9sNvaOW9roYapxf55-5gOvVNS-OK1Y9huPeKVP3aLJcKtzbJBn6rzU6jxXNSU2LlQV9x_Jwwlwm2i1-aFk5Hdj7WLohfPRSgcmru2dhv1Z56vpU-wi3MwucgxBzTvWLHwTVOg5h-Z257bxWlLouU5JCIYBrlPF3qzJrRzvhrwxVLXIQW8IQttt4Zo_C5GM28tMN_Vxe8Mn4oLOgAl3QW9iAPGR6tj5z0debovmR')", backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
          <div className="absolute inset-0 bg-primary/40 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
        </div>
        {/* Content Overlay */}
        <div className="relative h-full flex flex-col justify-end p-16 pb-20">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl max-w-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex -space-x-2 py-1">
                <img alt="User" className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-slate-800 object-cover shadow-sm" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD9Le8ja8zbp8RtwXp_dKq5_GxPGLCsnku33Fxfn2HKQ5fWTWR2VXiPJUTOdvUBwu5w_b6c6YG_1gHE6_95GebYcg0Y0Vh3zwPZVZP4nEUaDculh0h5kA-93VJfHJhLfWUfjBFYl2AYCHBkJWl1pdopUc2HneHXxyAs7TXQfA9Ej-FmnMzrHVzWSlJNK2On8RPev9iOW8DM5j2bSdZYH0xCyJQvnEmIHv7hgPeA7kOaTGGWel_FiRCTlvoAYyx2lXlc_qiR_zPSIDDT" />
                <img alt="User" className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-slate-800 object-cover shadow-sm" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDQdUCP0YjyAM65ztyj63RfQJ6R3vlO3ILkiQdPUdE52rhxHR_w5oqSv4eJfdOrLkl95bGnMP70upUGJ2PyV1qdlam_XaUkaH0xuWMl892om4qKZkUZrCgT0Yvdwaoj1K-hTGE94XFeFbV9Bzw44-8HQ5kQeiSRC5-is4NO3D3eJOj_srTIE2BW1IDcYoGezrq54Tx0A2e_Wg80uv3Tls1N5peMUWFa0-FpBpif_XAXqJ3svkVaIWwixaseIlZRNsc4OWqplJs2PO4z" />
                <img alt="User" className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-slate-800 object-cover shadow-sm" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAVUPJ2Cq7EhcVEwkozrApS-hdTHCKWMQUMxhJzjo7NKm1THedlY22m-t9HGkKOA4iTbhT-b5RcEhQ__KYED7LlDhES5AhRdzU6VMKyp73Nx_1_srIRy-42UmK3TZjG5YnV7h6VPeyELAU7URJuHXPNDC1sTF8YZqE0qc7zqusBfuQJumLwlBgF5peZGXDduq0m4uHbkUEQ_QYJcbeAhxJhuLoEoQ1h9sUKjuYpmOovYwnvdkKJkBJl2sqpcItkpQQgiUlYkuR5un0k" />
              </div>
              <span className="text-white/80 text-sm font-medium">+2.5k empresas confiam</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2 leading-snug">
              "O FinanceAI transformou nosso WhatsApp em uma máquina de controle financeiro."
            </h3>
            <div className="mt-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-green-400 filled">check_circle</span>
              <p className="text-slate-200 text-sm">Leitura automática de recibos</p>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-green-400 filled">check_circle</span>
              <p className="text-slate-200 text-sm">Conciliação bancária via chat</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const RequirementItem = ({ met, label }: { met: boolean; label: string }) => (
  <div className="flex items-center gap-1.5 transition-all">
    <span className={`material-symbols-outlined text-[12px] font-bold ${met ? 'text-green-500' : 'text-slate-300 dark:text-slate-600'}`}>
      {met ? 'check_circle' : 'circle'}
    </span>
    <span className={`text-[10px] font-medium ${met ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'}`}>{label}</span>
  </div>
);

export default Signup;