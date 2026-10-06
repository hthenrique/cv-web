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
  Database
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
  onToggleEditor
}) {
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

      {/* RIGHT: ZOOM + SAVE + PDF + PRINT */}
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
      </div>
    </header>
  );
}

