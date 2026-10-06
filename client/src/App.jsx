import React, { useState, useEffect } from 'react';
import TopBar from './components/TopBar';
import ResumeEditor from './components/ResumeEditor';
import ResumePreview from './components/ResumePreview';
import { fetchResume, saveResume, resetResume } from './services/api';
import { exportToPdf, printResume } from './utils/pdfExport';
import { Loader2 } from 'lucide-react';

function App() {
  const [resume, setResume] = useState(null);
  const [activeLanguage, setActiveLanguage] = useState('pt');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showEditor, setShowEditor] = useState(true);
  const [zoom, setZoom] = useState(0.85);

  // Load initial resume data from SQLite backend
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await fetchResume();
        setResume(data);
        if (data.activeLanguage) {
          setActiveLanguage(data.activeLanguage);
        }
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Save changes to SQLite
  const handleSave = async (dataToSave = resume) => {
    if (!dataToSave) return;
    try {
      setIsSaving(true);
      const saved = await saveResume({
        ...dataToSave,
        activeLanguage
      });
      setResume(saved);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      alert('Erro ao salvar no banco SQLite: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Switch language
  const handleLanguageChange = (lang) => {
    setActiveLanguage(lang);
    if (resume) {
      setResume({
        ...resume,
        activeLanguage: lang
      });
    }
  };

  // Export PDF
  const handleExportPdf = async () => {
    if (!resume) return;
    try {
      setIsExporting(true);
      const name = resume.translations?.[activeLanguage]?.personalInfo?.fullName || 'Henrique_Teixeira';
      const cleanName = name.trim().replace(/\s+/g, '_');
      const filename = `Curriculo_${cleanName}_${activeLanguage.toUpperCase()}.pdf`;
      await exportToPdf('resume-a4-page', filename);
    } catch (err) {
      alert('Erro ao exportar PDF: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  // Print
  const handlePrint = () => {
    printResume();
  };

  // Reset to original Henrique Teixeira data
  const handleReset = async () => {
    if (window.confirm('Tem certeza que deseja restaurar os dados originais do Henrique Teixeira a partir do banco de dados SQLite?')) {
      try {
        setLoading(true);
        const defaultData = await resetResume();
        setResume(defaultData);
        setActiveLanguage(defaultData.activeLanguage || 'pt');
      } catch (err) {
        alert('Erro ao restaurar: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-sm font-medium text-slate-300">
          Carregando currículo do banco SQLite...
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-100 font-sans">
      {/* TOPBAR */}
      <TopBar
        activeLanguage={activeLanguage}
        onLanguageChange={handleLanguageChange}
        onSave={() => handleSave()}
        isSaving={isSaving}
        saveSuccess={saveSuccess}
        onExportPdf={handleExportPdf}
        isExporting={isExporting}
        onPrint={handlePrint}
        zoom={zoom}
        onZoomChange={setZoom}
        showEditor={showEditor}
        onToggleEditor={() => setShowEditor(!showEditor)}
      />

      {/* MAIN WORKSPACE: EDITOR ON LEFT, PREVIEW ON RIGHT */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* COLLAPSIBLE EDITOR */}
        {showEditor && (
          <div className="no-print h-full z-10">
            <ResumeEditor
              resume={resume}
              activeLanguage={activeLanguage}
              onChange={(updated) => {
                setResume(updated);
              }}
              onReset={handleReset}
            />
          </div>
        )}

        {/* LIVE PREVIEW AREA */}
        <div className="flex-1 h-full overflow-hidden relative flex justify-center bg-slate-200/70">
          <ResumePreview
            resume={resume}
            language={activeLanguage}
            zoom={zoom}
          />
        </div>
      </div>
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('UI Error capturado:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-100 p-6 text-center">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-md w-full space-y-4 border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto text-xl font-bold">
              !
            </div>
            <h2 className="text-base font-bold text-slate-800">Ocorreu uma instabilidade na interface</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              {this.state.error?.message || 'Erro inesperado de renderização.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
            >
              Recarregar Aplicação
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function AppWrapper() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
