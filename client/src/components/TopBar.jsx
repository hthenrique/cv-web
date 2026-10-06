import React from 'react';
import {
  Save,
  Download,
  Printer,
  Globe,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  PanelLeftClose,
  PanelLeftOpen,
  Database,
  LogOut,
  User,
  KeyRound
} from 'lucide-react';

export default function TopBar({
  activeLanguage,
  onLanguageChange,
  onSave,
  isSaving,
  saveSuccess,
  onExportPdf,
  isExporting,
  onPrint,
  zoom,
  onZoomChange,
  showEditor,
  onToggleEditor,
  currentUser,
  onLogout,
  onOpenChangePassword
}) {
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <header className="no-print h-16 bg-white border-b border-slate-200 px-4 flex items-center justify-between z-20 select-none shadow-sm flex-shrink-0">
      {/* LEFT: TOGGLE EDITOR + APP TITLE */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleEditor}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
          title={showEditor ? 'Ocultar painel de edição' : 'Mostrar painel de edição'}
        >
          {showEditor ? (
            <PanelLeftClose className="w-5 h-5" />
          ) : (
            <PanelLeftOpen className="w-5 h-5" />
          )}
        </button>

        <div className="flex items-center gap-2">
          <span className="font-extrabold text-base tracking-tight text-slate-900 flex items-center gap-1.5">
            <span className="text-blue-600">Curriculo</span>Web
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Database className="w-3 h-3 text-emerald-600" />
            <span>SQLite Ativo</span>
          </span>
        </div>
      </div>

      {/* CENTER: LANGUAGE SWITCHER */}
      <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
        <button
          onClick={() => onLanguageChange('pt')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeLanguage === 'pt'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span className="text-sm">🇧🇷</span>
          <span>Português</span>
        </button>
        <button
          onClick={() => onLanguageChange('en')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeLanguage === 'en'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span className="text-sm">🇺🇸</span>
          <span>English</span>
        </button>
      </div>

      {/* RIGHT: ZOOM + SAVE + PDF + USER SESSION & LOGOUT */}
      <div className="flex items-center gap-2">
        {/* ZOOM CONTROLS (DESKTOP) */}
        <div className="hidden md:flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-0.5 text-xs text-slate-600">
          <button
            onClick={() => onZoomChange(Math.max(0.6, zoom - 0.1))}
            className="p-1 hover:bg-slate-200 rounded"
            title="Reduzir zoom"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="px-1.5 font-mono text-[11px] min-w-[42px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => onZoomChange(Math.min(1.4, zoom + 0.1))}
            className="p-1 hover:bg-slate-200 rounded"
            title="Aumentar zoom"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onZoomChange(1)}
            className="p-1 hover:bg-slate-200 rounded"
            title="Ajustar 100%"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* SAVE BUTTON */}
        <button
          onClick={onSave}
          disabled={isSaving}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold shadow-sm transition ${
            saveSuccess
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'bg-slate-800 text-white hover:bg-slate-900'
          }`}
          title="Salva alterações no banco SQLite local"
        >
          {saveSuccess ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Salvo no SQLite!</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {isSaving ? 'Salvando...' : 'Salvar no SQLite'}
              </span>
            </>
          )}
        </button>

        {/* PRINT BUTTON */}
        <button
          onClick={onPrint}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition shadow-sm"
          title="Imprimir ou Salvar em PDF via Navegador com proporção A4 exata"
        >
          <Printer className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Imprimir</span>
        </button>

        {/* DOWNLOAD PDF BUTTON */}
        <button
          onClick={onExportPdf}
          disabled={isExporting}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          title="Baixar arquivo PDF de alta definição"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{isExporting ? 'Gerando...' : 'Baixar PDF'}</span>
        </button>

        {/* USER PROFILE & LOGOUT */}
        {currentUser && (
          <div className="flex items-center pl-1 sm:pl-2 ml-1 border-l border-slate-200 gap-2">
            <div
              className="flex items-center gap-2 px-2 py-1 bg-slate-50 border border-slate-200/80 rounded-xl"
              title={`Usuário conectado: ${currentUser.name}\nEmail: ${currentUser.email}\nUUID: ${currentUser.uuid}`}
            >
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-[11px] font-extrabold shadow-sm">
                {getInitials(currentUser.name)}
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-[12px] font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-slate-400 font-mono leading-tight truncate max-w-[120px]">
                  {currentUser.email}
                </span>
              </div>
            </div>

            <button
              onClick={onOpenChangePassword}
              className="flex items-center gap-1.5 px-2.5 py-2 text-xs font-semibold text-slate-700 hover:text-blue-700 hover:bg-blue-50 border border-slate-200/80 hover:border-blue-200 rounded-lg transition cursor-pointer"
              title="Alterar sua senha de acesso"
            >
              <KeyRound className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Alterar Senha</span>
            </button>

            <button
              onClick={onLogout}
              className="flex items-center gap-1 px-2.5 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-lg transition cursor-pointer"
              title="Sair da sua conta e deslogar deste navegador"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Sair</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
