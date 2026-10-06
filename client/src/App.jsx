import React, { useState, useEffect } from 'react';
import TopBar from './components/TopBar';
import ResumeEditor from './components/ResumeEditor';
import ResumePreview from './components/ResumePreview';
import AuthScreen from './components/AuthScreen';
import ChangePasswordModal from './components/ChangePasswordModal';
import {
  fetchResume,
  saveResume,
  resetResume,
  getMe,
  logout,
  getUserUuid
} from './services/api';
import { exportToPdf, printResume } from './utils/pdfExport';
import { Loader2 } from 'lucide-react';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [resume, setResume] = useState(null);
  const [activeLanguage, setActiveLanguage] = useState('pt');
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showEditor, setShowEditor] = useState(true);
  const [zoom, setZoom] = useState(0.85);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  // Check stored user UUID in browser at startup
  useEffect(() => {
    async function checkAuthSession() {
      try {
        const savedUuid = getUserUuid();
        if (!savedUuid) {
          setCurrentUser(null);
          setAuthChecking(false);
          return;
        }

        // Validate session with backend SQLite
        const user = await getMe();
        if (user && user.uuid) {
          setCurrentUser(user);
          // Load this user's isolated resume
          setLoading(true);
          const data = await fetchResume();
          setResume(data);
          // O padrão deve sempre iniciar em português (pt)
          setActiveLanguage('pt');
        } else {
          setCurrentUser(null);
        }
      } catch (err) {
        console.error('Falha ao verificar sessão ou carregar dados:', err);
        setCurrentUser(null);
      } finally {
        setAuthChecking(false);
        setLoading(false);
      }
    }

    checkAuthSession();
  }, []);

  // Handle successful login/registration
  const handleLoginSuccess = async (user) => {
    setCurrentUser(user);
    try {
      setLoading(true);
      const data = await fetchResume();
      setResume(data);
      // Sempre iniciar na versão em português ao logar
      setActiveLanguage('pt');
    } catch (err) {
      console.error('Erro ao carregar currículo do usuário:', err);
      alert('Aviso: Não foi possível carregar os dados do currículo: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle user logout
  const handleLogout = () => {
    if (window.confirm('Deseja realmente sair da sua conta? Seu progresso salvo no SQLite permanecerá intacto.')) {
      logout();
      setCurrentUser(null);
      setResume(null);
    }
  };

  // Save changes to SQLite for the authenticated user
  const handleSave = async (dataToSave = resume) => {
    if (!dataToSave || !currentUser) return;
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

  // Switch language and update active theme for that language
  const handleLanguageChange = (lang) => {
    setActiveLanguage(lang);
    if (resume) {
      const langTheme = resume.themes?.[lang] || resume.theme;
      setResume({
        ...resume,
        activeLanguage: lang,
        theme: langTheme
      });
    }
  };

  // Export PDF
  const handleExportPdf = async () => {
    if (!resume) return;
    try {
      setIsExporting(true);
      const name =
        resume.translations?.[activeLanguage]?.personalInfo?.fullName ||
        currentUser?.name ||
        'Curriculo';
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

  // Reset to original data for the authenticated user
  const handleReset = async () => {
    if (
      window.confirm(
        'Tem certeza que deseja restaurar as informações originais do seu currículo a partir do banco de dados SQLite?'
      )
    ) {
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

  // Initial session verification loader
  if (authChecking) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white gap-3 select-none">
        <Loader2 className="w-9 h-9 animate-spin text-blue-500" />
        <p className="text-sm font-medium text-slate-300">
          Verificando credenciais no navegador...
        </p>
      </div>
    );
  }

  // Not logged in -> Show Login / Register Screen
  if (!currentUser) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // Loading resume data
  if (loading || !resume) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white gap-3 select-none">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-sm font-medium text-slate-300">
          Carregando seu currículo do banco SQLite...
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
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenChangePassword={() => setShowChangePasswordModal(true)}
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

      {/* CHANGE PASSWORD MODAL */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />
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
