import React, { useState } from 'react';
import {
  LogIn,
  UserPlus,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Database,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { login, register } from '../services/api';

export default function AuthScreen({ onLoginSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (mode === 'register') {
      if (!formData.name.trim()) {
        setError('Por favor, informe seu nome completo.');
        return;
      }
      if (!formData.email.trim() || !formData.email.includes('@')) {
        setError('Por favor, informe um e-mail válido.');
        return;
      }
      if (formData.password.length < 6) {
        setError('A senha deve conter no mínimo 6 caracteres.');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('As senhas não coincidem.');
        return;
      }

      try {
        setLoading(true);
        const user = await register(formData.name.trim(), formData.email.trim(), formData.password);
        setSuccessMsg('Conta criada com sucesso! Redirecionando...');
        setTimeout(() => {
          onLoginSuccess(user);
        }, 600);
      } catch (err) {
        setError(err.message || 'Falha ao realizar cadastro.');
      } finally {
        setLoading(false);
      }
    } else {
      if (!formData.email.trim()) {
        setError('Por favor, informe seu e-mail.');
        return;
      }
      if (!formData.password) {
        setError('Por favor, informe sua senha.');
        return;
      }

      try {
        setLoading(true);
        const user = await login(formData.email.trim(), formData.password);
        onLoginSuccess(user);
      } catch (err) {
        setError(err.message || 'E-mail ou senha incorretos.');
      } finally {
        setLoading(false);
      }
    }
  };

  // O usuário de teste e atalho de demonstração NUNCA aparecem em produção
  const isProduction =
    import.meta.env.PROD ||
    import.meta.env.MODE === 'production' ||
    (typeof window !== 'undefined' &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1');

  // Permitido somente quando rodando em ambiente de desenvolvimento local (Vite dev)
  const showTestUser = !isProduction && Boolean(import.meta.env.DEV);

  // Quick fill demo Henrique Teixeira (apenas dev)
  const handleFillHenrique = () => {
    if (!showTestUser) return;
    setMode('login');
    setFormData({
      name: '',
      email: 'ht.henrique@live.com',
      password: '123456',
      confirmPassword: ''
    });
    setError('');
  };

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-4 sm:p-6 text-slate-100 select-none">
      {/* BACKGROUND DECORATIVE GLOW */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* MAIN CONTAINER */}
      <div className="relative w-full max-w-md bg-white text-slate-800 rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* HEADER BAR */}
        <div className="bg-slate-900 px-6 pt-8 pb-7 text-white text-center relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/20 rounded-full blur-xl" />
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg mb-3">
            <Database className="w-6 h-6" />
          </div>

          <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-1.5">
            <span className="text-blue-400">Curriculo</span>
            <span>Web</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Crie, personalize e salve seu currículo profissional no banco de dados SQLite individual.
          </p>

          {/* TAB BUTTONS */}
          <div className="flex bg-slate-800/80 p-1 rounded-xl mt-6 border border-slate-700/60 max-w-xs mx-auto">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Entrar</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError('');
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Criar Conta</span>
            </button>
          </div>
        </div>

        {/* FORM CONTENT */}
        <div className="p-6 sm:p-7">
          {/* ERROR ALERT */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="font-medium leading-relaxed">{error}</div>
            </div>
          )}

          {/* SUCCESS ALERT */}
          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* NAME FIELD (REGISTER ONLY) */}
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nome Completo
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Seu nome completo"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
                  />
                </div>
              </div>
            )}

            {/* EMAIL FIELD */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                E-mail
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="seu.email@exemplo.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
                />
              </div>
            </div>

            {/* PASSWORD FIELD */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Senha {mode === 'register' && <span className="text-slate-400 font-normal">(mínimo 6 caracteres)</span>}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  tabIndex="-1"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* CONFIRM PASSWORD FIELD (REGISTER ONLY) */}
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Confirmar Senha
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
                  />
                </div>
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{mode === 'login' ? 'Entrando no sistema...' : 'Criando currículo...'}</span>
                </>
              ) : mode === 'login' ? (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Cadastrar e Começar</span>
                </>
              )}
            </button>
          </form>

          {/* DEMO / QUICK ACCESS SECTION - NEVER VISIBLE IN PRODUCTION */}
          {showTestUser && (
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
                  <span className="flex items-center gap-1.5 text-blue-700 font-bold">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    Acesso Rápido de Teste (Dev)
                  </span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full">
                    Desenvolvimento
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mb-2.5 leading-relaxed">
                  Ambiente de desenvolvimento ativo. Preencher conta demo:
                </p>
                <button
                  type="button"
                  onClick={handleFillHenrique}
                  className="w-full py-2 px-3 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-center gap-2 transition shadow-sm cursor-pointer"
                >
                  <span>Preencher Henrique Teixeira</span>
                </button>
              </div>
            </div>
          )}

          {/* SECURITY BADGE */}
          <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <span>Currículos isolados por usuário via SQLite & UUID</span>
          </div>
        </div>
      </div>
    </div>
  );
}
