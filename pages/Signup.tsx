import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { GoogleIcon, MicrosoftIcon, VersixLogo } from '../components/BrandedIcons';
import Input from '../components/Input';
import Button from '../components/Button';

const RequirementItem = ({ met, label }: { met: boolean; label: string }) => (
  <div className="flex items-center gap-1.5 transition-all">
    <span className={`material-symbols-outlined text-[12px] font-bold ${met ? 'text-green-500' : 'text-slate-300 dark:text-slate-600'}`}>
      {met ? 'check_circle' : 'circle'}
    </span>
    <span className={`text-[10px] font-medium ${met ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'}`}>{label}</span>
  </div>
);

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
    <div className="min-h-screen flex flex-col font-display bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-200">
      {/* Header / Nav */}
      <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap px-6 py-4 md:px-10 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
        <Link to="/" className="flex items-center">
          <VersixLogo className="h-[40px] w-auto" />
        </Link>
        <div className="hidden sm:flex gap-2">
          <span className="text-sm text-slate-500 dark:text-slate-400 font-medium self-center">Já tem uma conta?</span>
          <Link to="/login" className="flex cursor-pointer items-center justify-center overflow-hidden rounded-lg h-9 px-4 bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-bold">
            Fazer login
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col md:flex-row h-full">
        {/* Left Section: Form */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 bg-white dark:bg-slate-900 shadow-2xl md:shadow-none z-20">
          <div className="w-full max-w-md flex flex-col gap-6">
            {/* Form Header */}
            <div className="text-center md:text-left">
              <h2 className="text-[#0d141b] dark:text-white tracking-tight text-3xl font-bold leading-tight mb-2">
                Crie sua conta
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-base">
                Comece a automatizar suas finanças em minutos.
              </p>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSubmit} className="mt-2 space-y-5">
              {error && (
                <div className="p-3 rounded-lg bg-red-100 border border-red-200 text-red-600 text-sm font-medium">
                  {error}
                </div>
              )}

              {/* Full Name */}
              <Input
                label="Nome Completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: João Silva"
                required
                type="text"
                disabled={loading}
                leftIcon={<span className="material-symbols-outlined text-[20px]">person</span>}
              />

              {/* Email */}
              <Input
                label="Email Corporativo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@empresa.com"
                required
                type="email"
                disabled={loading}
                leftIcon={<span className="material-symbols-outlined text-[20px]">mail</span>}
              />

              {/* Password Group */}
              <div className="space-y-5">
                <div>
                  <Input
                    label="Senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="********"
                    required
                    type={showPassword ? 'text' : 'password'}
                    disabled={loading}
                    leftIcon={<span className="material-symbols-outlined text-[20px]">lock</span>}
                    rightIcon={<span className="material-symbols-outlined text-[20px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">{showPassword ? 'visibility_off' : 'visibility'}</span>}
                    onRightIconClick={() => setShowPassword(!showPassword)}
                  />
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

                <Input
                  label="Confirmar Senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="********"
                  required
                  type={showPassword ? 'text' : 'password'}
                  disabled={loading}
                  leftIcon={<span className="material-symbols-outlined text-[20px]">lock_reset</span>}
                />
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
              <Button
                type="submit"
                isLoading={loading}
                className="w-full h-[46px]"
                rightIcon={<span className="material-symbols-outlined text-sm">arrow_forward</span>}
              >
                Criar minha conta
              </Button>
            </form>

            {/* Mobile Only Login Link */}
            <div className="mt-4 text-center sm:hidden">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Já tem uma conta?
                <Link className="font-bold text-primary hover:text-primary ml-1" to="/login">Fazer login</Link>
              </p>
            </div>

            <div className="mt-auto pt-6 flex justify-center gap-6 text-xs text-slate-400">
              <Link to="/terms" className="hover:text-slate-600 dark:hover:text-slate-200 transition-colors">Termos de Uso</Link>
              <Link to="/privacy" className="hover:text-slate-600 dark:hover:text-slate-200 transition-colors">Privacidade</Link>
              <Link to="/help" className="hover:text-slate-600 dark:hover:text-slate-200 transition-colors">Ajuda</Link>
            </div>
          </div>
        </div>

        {/* Right Section: Visual/Marketing */}
        <div className="hidden md:flex md:w-1/2 lg:w-3/5 bg-slate-50 dark:bg-[#15202b] relative items-center justify-center overflow-hidden p-10">
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
                "O Versix AI transformou nosso WhatsApp em uma máquina de controle financeiro."
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
      </main>
    </div>
  );
};

export default Signup;