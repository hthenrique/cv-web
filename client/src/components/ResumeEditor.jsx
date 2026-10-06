import React, { useState } from 'react';
import {
  User,
  Briefcase,
  GraduationCap,
  Sparkles,
  Languages as LanguagesIcon,
  Palette,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Upload,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Copy,
  Crop,
  Loader2
} from 'lucide-react';
import { uploadPhoto, translateResume } from '../services/api';
import PhotoCropModal from './PhotoCropModal';

const COLOR_PRESETS = [
  {
    name: 'Enhancv Original',
    sidebarColor: '#162a45',
    sidebarTextColor: '#ffffff',
    accentColor: '#1e88e5',
    nameColor: '#162a45'
  },
  {
    name: 'Executive Slate',
    sidebarColor: '#1e293b',
    sidebarTextColor: '#ffffff',
    accentColor: '#0284c7',
    nameColor: '#0f172a'
  },
  {
    name: 'Emerald Corporate',
    sidebarColor: '#064e3b',
    sidebarTextColor: '#ffffff',
    accentColor: '#059669',
    nameColor: '#064e3b'
  },
  {
    name: 'Deep Royal',
    sidebarColor: '#1e1b4b',
    sidebarTextColor: '#ffffff',
    accentColor: '#4f46e5',
    nameColor: '#1e1b4b'
  },
  {
    name: 'Burgundy Elegance',
    sidebarColor: '#450a0a',
    sidebarTextColor: '#ffffff',
    accentColor: '#b91c1c',
    nameColor: '#450a0a'
  },
  {
    name: 'Minimal Black',
    sidebarColor: '#0f172a',
    sidebarTextColor: '#ffffff',
    accentColor: '#334155',
    nameColor: '#020617'
  }
];

export default function ResumeEditor({
  resume,
  activeLanguage,
  onChange,
  onReset
}) {
  const [activeTab, setActiveTab] = useState('personal');
  const [expandedExp, setExpandedExp] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [isSavingCrop, setIsSavingCrop] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  if (!resume) return null;

  const currentLang = activeLanguage || resume.activeLanguage || 'pt';
  const langData = resume.translations?.[currentLang] || {};
  const theme = resume.theme || {};

  // Generic updater for translation content
  const updateLangData = (field, value) => {
    const updatedTranslations = {
      ...resume.translations,
      [currentLang]: {
        ...langData,
        [field]: value
      }
    };
    onChange({
      ...resume,
      translations: updatedTranslations
    });
  };

  // Generic updater for theme config
  const updateTheme = (field, value) => {
    onChange({
      ...resume,
      theme: {
        ...theme,
        [field]: value
      }
    });
  };

  // Copy and translate content from other language
  const copyFromOtherLanguage = async () => {
    const otherLang = currentLang === 'pt' ? 'en' : 'pt';
    const sourceData = resume.translations?.[otherLang];
    if (!sourceData) {
      alert('Nenhum dado encontrado no outro idioma para copiar.');
      return;
    }

    const fromLabel = otherLang === 'pt' ? 'Português' : 'Inglês';
    const toLabel = currentLang === 'pt' ? 'Português' : 'Inglês';

    if (
      !window.confirm(
        `Deseja copiar e traduzir todo o conteúdo de ${fromLabel} para ${toLabel}? O conteúdo atual nesta aba será substituído.`
      )
    ) {
      return;
    }

    setIsTranslating(true);
    try {
      // Request translation from server API
      const translatedData = await translateResume(sourceData, otherLang, currentLang);

      // Atomic update of the entire language translation
      onChange({
        ...resume,
        translations: {
          ...resume.translations,
          [currentLang]: translatedData
        }
      });
    } catch (err) {
      console.warn('Falha na tradução automática, aplicando cópia direta dos dados:', err);
      // Fallback: Copy directly without translation so user data is never lost or stuck
      onChange({
        ...resume,
        translations: {
          ...resume.translations,
          [currentLang]: JSON.parse(JSON.stringify(sourceData))
        }
      });
      alert('Os dados foram copiados! Porém o serviço de tradução automática não respondeu, então o texto foi mantido no idioma original.');
    } finally {
      setIsTranslating(false);
    }
  };

  // Trigger Crop Modal when user selects a file
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Trigger Crop Modal on existing photo
  const handleOpenCropOnExisting = () => {
    if (resume.photoUrl) {
      setCropImageSrc(resume.photoUrl);
      setCropModalOpen(true);
    }
  };

  // Handle saving cropped avatar
  const handleCropComplete = async (croppedBlob) => {
    try {
      setIsSavingCrop(true);
      const file = new File([croppedBlob], 'avatar.png', { type: 'image/png' });
      const photoUrl = await uploadPhoto(file);
      onChange({
        ...resume,
        photoUrl
      });
      setCropModalOpen(false);
    } catch (err) {
      alert('Falha ao salvar foto recortada: ' + err.message);
    } finally {
      setIsSavingCrop(false);
    }
  };

  // Personal Info helpers
  const handlePersonalChange = (key, val) => {
    updateLangData('personalInfo', {
      ...(langData.personalInfo || {}),
      [key]: val
    });
  };

  // Experience helpers
  const experiences = langData.experiences || [];

  const addExperience = () => {
    const newExp = {
      id: 'exp-' + Date.now(),
      role: currentLang === 'en' ? 'Software Engineer' : 'Novo Cargo',
      company: currentLang === 'en' ? 'Company Name' : 'Nome da Empresa',
      period: currentLang === 'en' ? '01/2024 - Present' : '01/2024 - Presente',
      location: 'São Paulo',
      summary: '',
      bullets: [currentLang === 'en' ? 'Key achievement or project description' : 'Descrição da principal entrega ou projeto']
    };
    const updated = [newExp, ...experiences];
    updateLangData('experiences', updated);
    setExpandedExp(0);
  };

  const updateExp = (index, field, val) => {
    const updated = [...experiences];
    updated[index] = { ...updated[index], [field]: val };
    updateLangData('experiences', updated);
  };

  const removeExp = (index) => {
    const updated = experiences.filter((_, i) => i !== index);
    updateLangData('experiences', updated);
  };

  const moveExp = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= experiences.length) return;
    const updated = [...experiences];
    const [moved] = updated.splice(index, 1);
    updated.splice(target, 0, moved);
    updateLangData('experiences', updated);
    setExpandedExp(target);
  };

  const addBullet = (expIndex) => {
    const updated = [...experiences];
    const bullets = updated[expIndex].bullets || [];
    updated[expIndex].bullets = [...bullets, 'Nova realização / projeto'];
    updateLangData('experiences', updated);
  };

  const updateBullet = (expIndex, bulletIndex, val) => {
    const updated = [...experiences];
    updated[expIndex].bullets[bulletIndex] = val;
    updateLangData('experiences', updated);
  };

  const removeBullet = (expIndex, bulletIndex) => {
    const updated = [...experiences];
    updated[expIndex].bullets = updated[expIndex].bullets.filter((_, i) => i !== bulletIndex);
    updateLangData('experiences', updated);
  };

  // Education helpers
  const education = langData.education || [];

  const addEducation = () => {
    const newEdu = {
      id: 'edu-' + Date.now(),
      degree: currentLang === 'en' ? 'Degree / Course' : 'Curso ou Grau',
      institution: currentLang === 'en' ? 'University / College' : 'Instituição de Ensino',
      period: '2020 - 2024',
      location: 'São Paulo'
    };
    updateLangData('education', [...education, newEdu]);
  };

  const updateEdu = (index, field, val) => {
    const updated = [...education];
    updated[index] = { ...updated[index], [field]: val };
    updateLangData('education', updated);
  };

  const removeEdu = (index) => {
    updateLangData('education', education.filter((_, i) => i !== index));
  };

  // Skills helpers
  const skills = langData.skills || [{ id: 'skill-1', title: 'Habilidades', items: [] }];

  const addSkillItem = (groupIndex = 0) => {
    if (!newSkillInput.trim()) return;
    const updated = [...skills];
    const items = updated[groupIndex].items || [];
    updated[groupIndex].items = [...items, newSkillInput.trim()];
    updateLangData('skills', updated);
    setNewSkillInput('');
  };

  const removeSkillItem = (groupIndex, itemIndex) => {
    const updated = [...skills];
    updated[groupIndex].items = updated[groupIndex].items.filter((_, i) => i !== itemIndex);
    updateLangData('skills', updated);
  };

  // Languages helpers
  const languages = langData.languages || [];

  const addLanguage = () => {
    const newLang = {
      id: 'lang-' + Date.now(),
      name: currentLang === 'en' ? 'New Language' : 'Novo Idioma',
      level: currentLang === 'en' ? 'Intermediate' : 'Intermediário',
      score: 3
    };
    updateLangData('languages', [...languages, newLang]);
  };

  const updateLanguage = (index, field, val) => {
    const updated = [...languages];
    updated[index] = { ...updated[index], [field]: val };
    updateLangData('languages', updated);
  };

  const removeLanguage = (index) => {
    updateLangData('languages', languages.filter((_, i) => i !== index));
  };

  const tabs = [
    { id: 'personal', label: 'Dados Pessoais', icon: User },
    { id: 'design', label: 'Cores & Design', icon: Palette },
    { id: 'summary', label: 'Resumo', icon: Sparkles },
    { id: 'experience', label: 'Experiência', icon: Briefcase },
    { id: 'education', label: 'Educação', icon: GraduationCap },
    { id: 'skills', label: 'Habilidades', icon: Sparkles },
    { id: 'languages', label: 'Idiomas', icon: LanguagesIcon }
  ];

  return (
    <div className="w-full lg:w-[480px] xl:w-[520px] bg-white border-r border-slate-200 flex flex-col h-full overflow-hidden flex-shrink-0 shadow-lg select-none">
      {/* HEADER WITH LANGUAGE CONTEXT & ACTIONS */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/70">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Editor do Currículo</h2>
            <p className="text-xs text-slate-500">
              Editando versão:{' '}
              <span className="font-semibold text-blue-600">
                {currentLang === 'pt' ? '🇧🇷 Português' : '🇺🇸 Inglês'}
              </span>
            </p>
          </div>
          <button
            onClick={copyFromOtherLanguage}
            disabled={isTranslating}
            title={`Copiar e traduzir dados do ${currentLang === 'pt' ? 'Inglês' : 'Português'}`}
            className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-blue-700 bg-white hover:bg-blue-50 border border-slate-200 px-2.5 py-1.5 rounded-md transition shadow-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isTranslating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>Traduzindo...</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-blue-600" />
                <span>Copiar e Traduzir do {currentLang === 'pt' ? 'EN' : 'PT'}</span>
              </>
            )}
          </button>
        </div>

        {/* HORIZONTAL TAB SELECTOR */}
        <div className="flex gap-1 overflow-x-auto pb-1 mt-3 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB CONTENT PANEL */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 select-text">
        {/* TAB 1: PERSONAL INFO */}
        {activeTab === 'personal' && (
          <div className="space-y-4">
            {/* PHOTO SECTION IN PERSONAL TAB */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {resume.photoUrl ? (
                  <div
                    className="relative group cursor-pointer"
                    onClick={handleOpenCropOnExisting}
                    title="Clique para ajustar o corte da foto"
                  >
                    <img
                      src={resume.photoUrl}
                      alt="Foto"
                      className="w-12 h-12 rounded-full object-cover border-2 border-blue-500 shadow-sm group-hover:opacity-85 transition"
                    />
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white">
                      <Crop className="w-4 h-4" />
                    </div>
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-500">
                    <User className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Foto de Perfil</h4>
                  <p className="text-[11px] text-slate-500">
                    {resume.photoUrl
                      ? 'Foto carregada e visível'
                      : 'Nenhuma foto (campo vazio)'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {resume.photoUrl && (
                  <button
                    type="button"
                    onClick={handleOpenCropOnExisting}
                    title="Ajustar corte da foto"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition font-medium"
                  >
                    <Crop className="w-3.5 h-3.5" />
                    <span>Ajustar Corte</span>
                  </button>
                )}
                <label className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium cursor-pointer transition shadow-sm">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{resume.photoUrl ? 'Trocar' : 'Carregar'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </label>
                {resume.photoUrl && (
                  <button
                    type="button"
                    onClick={() => onChange({ ...resume, photoUrl: null })}
                    title="Remover foto"
                    className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition border border-red-200"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome Completo
              </label>
              <input
                type="text"
                value={langData.personalInfo?.fullName || ''}
                onChange={(e) => handlePersonalChange('fullName', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Ex: HENRIQUE TEIXEIRA"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cargo / Título Profissional
              </label>
              <input
                type="text"
                value={langData.personalInfo?.headline || ''}
                onChange={(e) => handlePersonalChange('headline', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Ex: Engenheiro de Software Java"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Telefone
                </label>
                <input
                  type="text"
                  value={langData.personalInfo?.phone || ''}
                  onChange={(e) => handlePersonalChange('phone', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="+55 (11) 952883043"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  value={langData.personalInfo?.email || ''}
                  onChange={(e) => handlePersonalChange('email', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="ht.henrique@live.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Localização (Endereço, Cidade - UF, País)
              </label>
              <input
                type="text"
                value={langData.personalInfo?.location || ''}
                onChange={(e) => handlePersonalChange('location', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Rua dos Piauienses, Itapevi – SP, Brasil"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  LinkedIn (Opcional)
                </label>
                <input
                  type="text"
                  value={langData.personalInfo?.linkedin || ''}
                  onChange={(e) => handlePersonalChange('linkedin', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="linkedin.com/in/henrique"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  GitHub (Opcional)
                </label>
                <input
                  type="text"
                  value={langData.personalInfo?.github || ''}
                  onChange={(e) => handlePersonalChange('github', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="github.com/henrique"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DESIGN & CORES */}
        {activeTab === 'design' && (
          <div className="space-y-5">
            {/* PHOTO MANAGEMENT */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Foto de Perfil
              </h3>

              {resume.photoUrl ? (
                <div className="flex items-center gap-4">
                  <div
                    className="relative group cursor-pointer"
                    onClick={handleOpenCropOnExisting}
                    title="Clique para ajustar o corte da foto"
                  >
                    <img
                      src={resume.photoUrl}
                      alt="Avatar"
                      className="w-16 h-16 rounded-full object-cover border-2 border-blue-500 shadow-sm group-hover:opacity-85 transition"
                    />
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white">
                      <Crop className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleOpenCropOnExisting}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition"
                      >
                        <Crop className="w-3.5 h-3.5" />
                        <span>Ajustar Corte</span>
                      </button>
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium cursor-pointer transition shadow-sm">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Trocar Foto</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoSelect}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          onChange({
                            ...resume,
                            photoUrl: null
                          });
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remover Foto</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-slate-600 flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={theme.showPhoto !== false}
                          onChange={(e) => updateTheme('showPhoto', e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span>Exibir foto no currículo</span>
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 border-2 border-dashed border-slate-300 rounded-xl bg-white text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700">Nenhuma foto cadastrada</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      O espaço da foto no currículo ficará vazio até você enviar uma imagem.
                    </p>
                  </div>
                  <label className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition shadow-sm">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Fazer Upload de Foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {/* Photo Shape */}
              <div className="pt-2 border-t border-slate-200/80">
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Formato da Foto:
                </label>
                <div className="flex gap-2">
                  {[
                    { id: 'circle', label: 'Círculo' },
                    { id: 'rounded', label: 'Arredondado' },
                    { id: 'square', label: 'Quadrado' }
                  ].map((shape) => (
                    <button
                      key={shape.id}
                      onClick={() => updateTheme('photoShape', shape.id)}
                      className={`px-3 py-1 text-xs rounded-md border transition ${
                        (theme.photoShape || 'circle') === shape.id
                          ? 'bg-blue-100 border-blue-500 text-blue-700 font-semibold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {shape.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* COLOR PALETTES PRESETS */}
            <div>
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wide mb-2">
                Paletas de Cores Prontas
              </label>
              <div className="grid grid-cols-2 gap-2">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => {
                      onChange({
                        ...resume,
                        theme: {
                          ...theme,
                          sidebarColor: preset.sidebarColor,
                          sidebarTextColor: preset.sidebarTextColor,
                          accentColor: preset.accentColor,
                          nameColor: preset.nameColor
                        }
                      });
                    }}
                    className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg hover:border-blue-400 bg-white transition text-left"
                  >
                    <div className="flex gap-1">
                      <span
                        className="w-4 h-4 rounded-full border border-slate-300"
                        style={{ backgroundColor: preset.sidebarColor }}
                      />
                      <span
                        className="w-4 h-4 rounded-full border border-slate-300"
                        style={{ backgroundColor: preset.accentColor }}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-700">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* CUSTOM COLOR PICKERS */}
            <div className="space-y-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wide">
                Personalização de Cores Específicas
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">
                    Barra Lateral
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={theme.sidebarColor || '#162a45'}
                      onChange={(e) => updateTheme('sidebarColor', e.target.value)}
                      className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={theme.sidebarColor || '#162a45'}
                      onChange={(e) => updateTheme('sidebarColor', e.target.value)}
                      className="w-20 px-2 py-1 text-xs border border-slate-300 rounded font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-600 mb-1">
                    Destaques (Azul)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={theme.accentColor || '#1e88e5'}
                      onChange={(e) => updateTheme('accentColor', e.target.value)}
                      className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={theme.accentColor || '#1e88e5'}
                      onChange={(e) => updateTheme('accentColor', e.target.value)}
                      className="w-20 px-2 py-1 text-xs border border-slate-300 rounded font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-600 mb-1">
                    Cor do Nome
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={theme.nameColor || '#162a45'}
                      onChange={(e) => updateTheme('nameColor', e.target.value)}
                      className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={theme.nameColor || '#162a45'}
                      onChange={(e) => updateTheme('nameColor', e.target.value)}
                      className="w-20 px-2 py-1 text-xs border border-slate-300 rounded font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-600 mb-1">
                    Texto Lateral
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={theme.sidebarTextColor || '#ffffff'}
                      onChange={(e) => updateTheme('sidebarTextColor', e.target.value)}
                      className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={theme.sidebarTextColor || '#ffffff'}
                      onChange={(e) => updateTheme('sidebarTextColor', e.target.value)}
                      className="w-20 px-2 py-1 text-xs border border-slate-300 rounded font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* FONTS */}
            <div>
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wide mb-1">
                Tipografia (Fonte)
              </label>
              <select
                value={theme.fontFamily || 'Inter, sans-serif'}
                onChange={(e) => updateTheme('fontFamily', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none"
              >
                <option value="Inter, sans-serif">Inter (Moderna / Recomendada)</option>
                <option value="Roboto, sans-serif">Roboto (Clean e Precisa)</option>
                <option value="Poppins, sans-serif">Poppins (Geométrica)</option>
                <option value="Merriweather, serif">Merriweather (Tradicional Serif)</option>
              </select>
            </div>

            {/* SPACING & DENSITY (FIT TO 1 PAGE) */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Densidade & Espaçamento
                </label>
                <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {theme.density === 'compact' ? 'Caber em 1 Página' : theme.density === 'relaxed' ? 'Espaçoso' : 'Padrão'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Se você adicionar 4 ou mais experiências e o texto passar do final da folha, use o modo <strong>Compacto</strong> para ajustar tudo perfeitamente em 1 página.
              </p>
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {[
                  { id: 'compact', label: 'Compacto', desc: '1 Página (4+ cargos)' },
                  { id: 'normal', label: 'Padrão', desc: 'Normal (3 cargos)' },
                  { id: 'relaxed', label: 'Espaçoso', desc: 'Arejado (1-2 cargos)' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updateTheme('density', opt.id)}
                    className={`p-2 rounded-lg border text-center transition ${
                      (theme.density || 'normal') === opt.id
                        ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-xs">{opt.label}</div>
                    <div className={`text-[9px] mt-0.5 ${(theme.density || 'normal') === opt.id ? 'text-blue-100' : 'text-slate-400'}`}>
                      {opt.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: RESUMO */}
        {activeTab === 'summary' && (
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Apresentação Profissional
            </label>
            <textarea
              rows={8}
              value={langData.summary || ''}
              onChange={(e) => updateLangData('summary', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed"
              placeholder="Descreva sua experiência, áreas de foco, tecnologias de missão crítica..."
            />
            <p className="text-[11px] text-slate-500 text-right">
              {langData.summary?.length || 0} caracteres
            </p>
          </div>
        )}

        {/* TAB 4: EXPERIÊNCIA */}
        {activeTab === 'experience' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-900 uppercase">
                {experiences.length} Experiências Cadastradas
              </span>
              <button
                onClick={addExperience}
                className="flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md font-medium shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Cargo</span>
              </button>
            </div>

            {/* Quick fit helper for 4+ experiences */}
            {experiences.length >= 4 && theme.density !== 'compact' && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between gap-2 text-xs text-blue-900 shadow-sm">
                <div>
                  <div className="font-bold">Deseja que todas as 4 experiências caibam em 1 página?</div>
                  <div className="text-[11px] text-blue-700">Ative o modo compacto para reduzir margens e ajustar perfeitamente.</div>
                </div>
                <button
                  type="button"
                  onClick={() => updateTheme('density', 'compact')}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition whitespace-nowrap shadow-sm"
                >
                  Ajustar para 1 Página
                </button>
              </div>
            )}

            <div className="space-y-3">
              {experiences.map((exp, idx) => {
                const isExpanded = expandedExp === idx;
                return (
                  <div
                    key={exp.id || idx}
                    className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm"
                  >
                    {/* Item Header */}
                    <div
                      onClick={() => setExpandedExp(isExpanded ? null : idx)}
                      className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 cursor-pointer transition"
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="font-bold text-xs text-slate-800 truncate">
                          {exp.role || 'Cargo Não Especificado'}
                        </div>
                        <div className="text-[11px] text-blue-600 truncate">
                          {exp.company} • {exp.period}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveExp(idx, -1);
                          }}
                          disabled={idx === 0}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveExp(idx, 1);
                          }}
                          disabled={idx === experiences.length - 1}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Excluir esta experiência?')) {
                              removeExp(idx);
                            }
                          }}
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-500" />
                        )}
                      </div>
                    </div>

                    {/* Item Form Body */}
                    {isExpanded && (
                      <div className="p-3.5 space-y-3 border-t border-slate-200">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                              Cargo
                            </label>
                            <input
                              type="text"
                              value={exp.role || ''}
                              onChange={(e) => updateExp(idx, 'role', e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                              Empresa
                            </label>
                            <input
                              type="text"
                              value={exp.company || ''}
                              onChange={(e) => updateExp(idx, 'company', e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                              Período
                            </label>
                            <input
                              type="text"
                              value={exp.period || ''}
                              onChange={(e) => updateExp(idx, 'period', e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded outline-none"
                              placeholder="03/2026 - Presente"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                              Localização
                            </label>
                            <input
                              type="text"
                              value={exp.location || ''}
                              onChange={(e) => updateExp(idx, 'location', e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded outline-none"
                              placeholder="São Paulo"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                            Resumo da Atuação
                          </label>
                          <textarea
                            rows={2}
                            value={exp.summary || ''}
                            onChange={(e) => updateExp(idx, 'summary', e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded outline-none"
                            placeholder="Atuação especializada na arquitetura..."
                          />
                        </div>

                        {/* Bullets / Key Achievements */}
                        <div className="pt-2 border-t border-slate-100">
                          <div className="flex justify-between items-center mb-1.5">
                            <label className="text-[11px] font-bold text-slate-700">
                              Projetos e Entregas (Marcadores):
                            </label>
                            <button
                              type="button"
                              onClick={() => addBullet(idx)}
                              className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Adicionar Item</span>
                            </button>
                          </div>

                          <div className="space-y-1.5">
                            {(exp.bullets || []).map((bullet, bIdx) => (
                              <div key={bIdx} className="flex items-start gap-1.5">
                                <span className="text-slate-400 mt-1">•</span>
                                <textarea
                                  rows={2}
                                  value={bullet}
                                  onChange={(e) => updateBullet(idx, bIdx, e.target.value)}
                                  className="flex-1 px-2 py-1 text-xs border border-slate-300 rounded outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeBullet(idx, bIdx)}
                                  className="text-red-400 hover:text-red-600 p-1"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: EDUCAÇÃO */}
        {activeTab === 'education' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-900 uppercase">
                Formação Acadêmica
              </span>
              <button
                onClick={addEducation}
                className="flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md font-medium shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Formação</span>
              </button>
            </div>

            <div className="space-y-3">
              {education.map((edu, idx) => (
                <div
                  key={edu.id || idx}
                  className="p-3 border border-slate-200 rounded-xl bg-white space-y-2 relative"
                >
                  <button
                    onClick={() => removeEdu(idx)}
                    className="absolute top-3 right-3 text-red-400 hover:text-red-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      Curso / Grau
                    </label>
                    <input
                      type="text"
                      value={edu.degree || ''}
                      onChange={(e) => updateEdu(idx, 'degree', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded outline-none"
                      placeholder="Gestão da TI - Tecnólogo"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      Instituição
                    </label>
                    <input
                      type="text"
                      value={edu.institution || ''}
                      onChange={(e) => updateEdu(idx, 'institution', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded outline-none"
                      placeholder="Estácio"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                        Período
                      </label>
                      <input
                        type="text"
                        value={edu.period || ''}
                        onChange={(e) => updateEdu(idx, 'period', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded outline-none"
                        placeholder="08/2017 - 12/2019"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                        Localização
                      </label>
                      <input
                        type="text"
                        value={edu.location || ''}
                        onChange={(e) => updateEdu(idx, 'location', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded outline-none"
                        placeholder="Carapicuíba"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: HABILIDADES */}
        {activeTab === 'skills' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-900 uppercase mb-1">
                Subtítulo do Grupo (Opcional)
              </label>
              <input
                type="text"
                value={skills[0]?.title || ''}
                onChange={(e) => {
                  const updated = [...skills];
                  updated[0] = { ...updated[0], title: e.target.value };
                  updateLangData('skills', updated);
                }}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none"
                placeholder="(Opcional - deixe em branco para não exibir)"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Adicionar Nova Habilidade:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSkillItem(0);
                    }
                  }}
                  className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Docker, Quarkus, Kafka... (Pressione Enter)"
                />
                <button
                  type="button"
                  onClick={() => addSkillItem(0)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Habilidades Cadastradas ({skills[0]?.items?.length || 0}):
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-64 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-lg">
                {(skills[0]?.items || []).map((skill, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-md text-xs text-slate-700 shadow-sm"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => removeSkillItem(0, idx)}
                      className="text-slate-400 hover:text-red-500"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: IDIOMAS */}
        {activeTab === 'languages' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-900 uppercase">
                Idiomas & Fluência
              </span>
              <button
                onClick={addLanguage}
                className="flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md font-medium shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Idioma</span>
              </button>
            </div>

            <div className="space-y-3">
              {languages.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-3 border border-slate-200 rounded-xl bg-white space-y-2 relative"
                >
                  <button
                    onClick={() => removeLanguage(idx)}
                    className="absolute top-3 right-3 text-red-400 hover:text-red-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                        Idioma
                      </label>
                      <input
                        type="text"
                        value={item.name || ''}
                        onChange={(e) => updateLanguage(idx, 'name', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded outline-none"
                        placeholder="Inglês"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                        Nível Textual
                      </label>
                      <input
                        type="text"
                        value={item.level || ''}
                        onChange={(e) => updateLanguage(idx, 'level', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded outline-none"
                        placeholder="Intermediário"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Nível em Bolinhas (1 a 5):
                    </label>
                    <div className="flex gap-2 items-center">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <button
                          key={score}
                          type="button"
                          onClick={() => updateLanguage(idx, 'score', score)}
                          className={`w-7 h-7 rounded-full text-xs font-bold transition ${
                            score <= (item.score || 1)
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* FOOTER ACTIONS */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded hover:bg-red-50 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restaurar Dados Originais</span>
        </button>
      </div>

      {/* PHOTO CROP MODAL */}
      <PhotoCropModal
        isOpen={cropModalOpen}
        imageSrc={cropImageSrc}
        onClose={() => setCropModalOpen(false)}
        onCropComplete={handleCropComplete}
        isProcessing={isSavingCrop}
      />
    </div>
  );
}

