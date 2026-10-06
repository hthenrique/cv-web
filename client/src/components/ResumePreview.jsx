import React from 'react';
import { Phone, Mail, MapPin, Globe, ExternalLink } from 'lucide-react';

function LinkedinIcon({ className, style }) {
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function GithubIcon({ className, style }) {
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  );
}

export default function ResumePreview({ resume, language, zoom = 1 }) {
  if (!resume) return null;

  const [pageHeight, setPageHeight] = React.useState(1123);
  const pageRef = React.useRef(null);

  React.useEffect(() => {
    if (pageRef.current) {
      const updateHeight = () => {
        if (pageRef.current) {
          setPageHeight(Math.max(1123, pageRef.current.offsetHeight));
        }
      };
      updateHeight();
      const observer = new ResizeObserver(updateHeight);
      observer.observe(pageRef.current);
      return () => observer.disconnect();
    }
  }, [resume, language]);

  const { theme, photoUrl } = resume;
  const lang = language || resume.activeLanguage || 'pt';
  const data = resume.translations?.[lang] || resume.translations?.['pt'] || {};

  const {
    personalInfo = {},
    summary = '',
    experiences = [],
    education = [],
    skills = [],
    languages = [],
    customSections = []
  } = data;

  const sidebarBg = theme?.sidebarColor || '#162a45';
  const sidebarText = theme?.sidebarTextColor || '#ffffff';
  const accentColor = theme?.accentColor || '#1e88e5';
  const nameColor = theme?.nameColor || '#162a45';
  const showPhoto = theme?.showPhoto !== false;
  const photoShape = theme?.photoShape || 'circle';

  // Density / Spacing settings (compact / normal / relaxed)
  // Smart default: if 4+ experiences are present and user hasn't explicitly set density, default to 'compact' to keep it on 1 page!
  const density = theme?.density || (experiences.length >= 4 ? 'compact' : 'normal');
  const isCompact = density === 'compact';
  const isRelaxed = density === 'relaxed';

  const sidebarPadding = isCompact ? 'p-4' : isRelaxed ? 'p-7' : 'p-6';
  const mainPadding = isCompact ? 'p-4 pl-5' : isRelaxed ? 'p-7 pl-8' : 'p-6 pl-7';
  const photoSize = isCompact ? 'w-20 h-20' : 'w-28 h-28';
  const expSpacing = isCompact ? 'space-y-1.5' : isRelaxed ? 'space-y-4' : 'space-y-3';
  const bulletSize = isCompact ? 'text-[9px] leading-[1.28]' : 'text-[10px] leading-[1.36]';
  const summarySize = isCompact ? 'text-[9.5px] leading-[1.3]' : 'text-[10.5px] leading-[1.38]';
  const sidebarSummarySize = isCompact ? 'text-[10px] leading-[1.3]' : 'text-[11px] leading-[1.38]';
  const roleTitleSize = isCompact ? 'text-[11.5px]' : 'text-[12.5px]';
  const sidebarSpace = isCompact ? 'space-y-2.5' : 'space-y-4';
  const nameSize = isCompact ? 'text-[22px]' : 'text-[25px]';
  const headlineSize = isCompact ? 'text-[12.5px]' : 'text-[13.5px]';

  // Section titles based on active language
  const labels = {
    summary: lang === 'en' ? 'SUMMARY' : 'RESUMO',
    education: lang === 'en' ? 'EDUCATION' : 'EDUCAÇÃO',
    skills: lang === 'en' ? 'SKILLS' : 'HABILIDADES',
    languages: lang === 'en' ? 'LANGUAGES' : 'IDIOMAS',
    experience: lang === 'en' ? 'EXPERIENCE' : 'EXPERIÊNCIA',
    present: lang === 'en' ? 'Present' : 'Presente',
  };

  return (
    <div className="w-full min-h-full flex justify-center items-start overflow-auto p-4 md:p-8 bg-slate-200/70">
      <div
        className="flex-shrink-0 transition-all duration-150 relative"
        style={{
          width: `${794 * zoom}px`,
          height: `${pageHeight * zoom}px`,
        }}
      >
        <div
          ref={pageRef}
          id="resume-a4-page"
          className="print-page bg-white shadow-2xl select-text"
          style={{
            width: '794px',       // Exact 210mm at 96 DPI
            minHeight: '1123px',   // At least 1 A4 page (297mm at 96 DPI)
            display: 'flex',
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            fontFamily: theme?.fontFamily || 'Inter, sans-serif',
            position: 'absolute',
            top: 0,
            left: 0
          }}
        >
        {/* VISUAL PAGE BREAK MARKER (SCREEN ONLY, IF OVERFLOWING 1ST PAGE) */}
        <div
          className="no-print absolute left-0 right-0 border-b-2 border-dashed border-rose-400/80 z-20 pointer-events-none flex items-center justify-end pr-3"
          style={{ top: '1123px' }}
        >
          <span className="bg-rose-500 text-white text-[9.5px] font-bold px-2 py-0.5 rounded-b shadow-sm">
            Limite da Página 1 (A4)
          </span>
        </div>

        {/* LEFT COLUMN / SIDEBAR */}
        <div
          className={`w-[280px] flex-shrink-0 ${sidebarPadding} flex flex-col justify-between`}
          style={{
            backgroundColor: sidebarBg,
            color: sidebarText
          }}
        >
          <div className={sidebarSpace}>
            {/* PHOTO (Render only if photoUrl exists and is not empty) */}
            {showPhoto && photoUrl && (
              <div className="flex justify-center pt-1 pb-1">
                <div
                  className={`overflow-hidden border-2 border-white/80 shadow-md ${photoSize} ${
                    photoShape === 'circle'
                      ? 'rounded-full'
                      : photoShape === 'rounded'
                      ? 'rounded-2xl'
                      : 'rounded-none'
                  }`}
                >
                  <img
                    src={photoUrl}
                    alt={personalInfo.fullName || 'Foto de Perfil'}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* RESUMO / SUMMARY */}
            {summary && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider pb-1 mb-2 border-b border-white/20">
                  {labels.summary}
                </h3>
                <p className={`${sidebarSummarySize} text-white/90 text-justify`}>
                  {summary}
                </p>
              </div>
            )}

            {/* EDUCAÇÃO / EDUCATION */}
            {education && education.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider pb-1 mb-2 border-b border-white/20">
                  {labels.education}
                </h3>
                <div className="space-y-2">
                  {education.map((edu, idx) => (
                    <div key={edu.id || idx}>
                      <h4 className="text-[11.5px] font-bold text-white leading-snug">
                        {edu.degree}
                      </h4>
                      <div className="text-[11px] text-white/80">{edu.institution}</div>
                      <div className="flex justify-between text-[10px] text-white/70 mt-0.5">
                        <span>{edu.period}</span>
                        <span>{edu.location}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* HABILIDADES / SKILLS */}
            {skills && skills.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider pb-1 mb-2 border-b border-white/20">
                  {labels.skills}
                </h3>
                {skills.map((group, idx) => (
                  <div key={group.id || idx} className="space-y-1">
                    {group.title && group.title.trim() && !/^(t[ií]tulo do grupo|group title)$/i.test(group.title.trim()) && (
                      <h4 className="text-[11px] font-semibold text-white/90">
                        {group.title}
                      </h4>
                    )}
                    <p className="text-[10px] leading-[1.45] text-white/80">
                      {Array.isArray(group.items) ? group.items.join(' • ') : group.items}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* IDIOMAS / LANGUAGES */}
            {languages && languages.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider pb-1 mb-2 border-b border-white/20">
                  {labels.languages}
                </h3>
                <div className="space-y-1.5">
                  {languages.map((langItem, idx) => (
                    <div key={langItem.id || idx} className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-white">{langItem.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-white/75">{langItem.level}</span>
                        {/* 5-dot rating indicator */}
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((dot) => (
                            <span
                              key={dot}
                              className={`w-1.5 h-1.5 rounded-full inline-block ${
                                dot <= (langItem.score || 3)
                                  ? 'bg-white'
                                  : 'bg-white/25'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN / MAIN CONTENT */}
        <div className={`flex-1 ${mainPadding} flex flex-col justify-start bg-white text-slate-800`}>
          <div>
            {/* HEADER */}
            <div className="pb-2 border-b border-slate-200">
              <h1
                className={`${nameSize} font-extrabold tracking-tight leading-tight uppercase`}
                style={{ color: nameColor }}
              >
                {personalInfo.fullName || 'SEU NOME COMPLETO'}
              </h1>
              <h2
                className={`${headlineSize} font-semibold tracking-normal mt-0.5`}
                style={{ color: accentColor }}
              >
                {personalInfo.headline || 'Seu Cargo ou Especialidade'}
              </h2>

              {/* CONTACT DETAILS WITH 100% PERFECT 4-COLUMN CELL ALIGNMENT */}
              <table className={`${isCompact ? 'mt-1.5' : 'mt-2'} border-collapse`} style={{ tableLayout: 'auto' }}>
                <tbody>
                  {(personalInfo.phone || personalInfo.email) && (
                    <tr>
                      {/* Row 1: Phone Icon */}
                      <td className="align-middle p-0" style={{ width: '14px', height: '20px' }}>
                        {personalInfo.phone && (
                          <Phone className="w-3.5 h-3.5 block" style={{ color: accentColor }} />
                        )}
                      </td>
                      {/* Row 1: Phone Text */}
                      <td className="align-middle pl-1.5 pr-6 whitespace-nowrap" style={{ height: '20px' }}>
                        {personalInfo.phone && (
                          <span className="text-[10px] text-slate-600 block leading-tight">
                            {personalInfo.phone}
                          </span>
                        )}
                      </td>
                      {/* Row 1: Email Icon */}
                      <td className="align-middle p-0" style={{ width: '14px', height: '20px' }}>
                        {personalInfo.email && (
                          <Mail className="w-3.5 h-3.5 block" style={{ color: accentColor }} />
                        )}
                      </td>
                      {/* Row 1: Email Text */}
                      <td className="align-middle pl-1.5 whitespace-nowrap" style={{ height: '20px' }}>
                        {personalInfo.email && (
                          <span className="text-[10px] text-slate-600 block leading-tight">
                            {personalInfo.email}
                          </span>
                        )}
                      </td>
                    </tr>
                  )}

                  {(personalInfo.location || personalInfo.linkedin) && (
                    <tr>
                      {/* Row 2: Location Icon */}
                      <td className="align-middle p-0" style={{ width: '14px', height: '20px' }}>
                        {personalInfo.location && (
                          <MapPin className="w-3.5 h-3.5 block" style={{ color: accentColor }} />
                        )}
                      </td>
                      {/* Row 2: Location Text */}
                      <td className="align-middle pl-1.5 pr-6 whitespace-nowrap" style={{ height: '20px' }}>
                        {personalInfo.location && (
                          <span className="text-[10px] text-slate-600 block leading-tight">
                            {personalInfo.location}
                          </span>
                        )}
                      </td>
                      {/* Row 2: LinkedIn Icon */}
                      <td className="align-middle p-0" style={{ width: '14px', height: '20px' }}>
                        {personalInfo.linkedin && (
                          <LinkedinIcon className="w-3.5 h-3.5 block" style={{ color: accentColor }} />
                        )}
                      </td>
                      {/* Row 2: LinkedIn Text */}
                      <td className="align-middle pl-1.5 whitespace-nowrap" style={{ height: '20px' }}>
                        {personalInfo.linkedin && (
                          <span className="text-[10px] text-slate-600 block leading-tight">
                            {personalInfo.linkedin.replace(/^https?:\/\/(www\.)?/, '')}
                          </span>
                        )}
                      </td>
                    </tr>
                  )}

                  {personalInfo.github && (
                    <tr>
                      {/* Row 3: GitHub Icon */}
                      <td className="align-middle p-0" style={{ width: '14px', height: '20px' }}>
                        <GithubIcon className="w-3.5 h-3.5 block" style={{ color: accentColor }} />
                      </td>
                      {/* Row 3: GitHub Text */}
                      <td colSpan={3} className="align-middle pl-1.5 whitespace-nowrap" style={{ height: '20px' }}>
                        <span className="text-[10px] text-slate-600 block leading-tight">
                          {personalInfo.github.replace(/^https?:\/\/(www\.)?/, '')}
                        </span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* EXPERIÊNCIA / EXPERIENCE */}
            {experiences && experiences.length > 0 && (
              <div className={isCompact ? 'mt-2' : 'mt-3'}>
                <h3
                  className={`text-xs font-bold uppercase tracking-wider ${isCompact ? 'pb-0.5 mb-1.5' : 'pb-1 mb-2'} border-b-2`}
                  style={{
                    color: nameColor,
                    borderColor: accentColor
                  }}
                >
                  {labels.experience}
                </h3>

                <div className={expSpacing}>
                  {experiences.map((exp, idx) => (
                    <div key={exp.id || idx} className="experience-item text-slate-800">
                      {/* Job Title and Period */}
                      <div className="flex justify-between items-baseline">
                        <h4 className={`${roleTitleSize} font-bold text-slate-900 leading-tight`}>
                          {exp.role}
                        </h4>
                        <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">
                          {exp.period}
                        </span>
                      </div>

                      {/* Company and Location */}
                      <div className="flex justify-between items-baseline mt-0.5">
                        <span
                          className="text-[11px] font-semibold"
                          style={{ color: accentColor }}
                        >
                          {exp.company}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {exp.location}
                        </span>
                      </div>

                      {/* Job Overview / Summary */}
                      {exp.summary && (
                        <p className={`${summarySize} text-slate-700 mt-0.5`}>
                          {exp.summary}
                        </p>
                      )}

                      {/* Achievements / Bullets */}
                      {exp.bullets && exp.bullets.length > 0 && (
                        <ul className={`mt-1 ${isCompact ? 'space-y-0.5' : 'space-y-1'} ${bulletSize} text-slate-700`}>
                          {exp.bullets.map((bullet, bIdx) => (
                            <li key={bIdx} className="flex items-start gap-1.5">
                              <span
                                className="font-bold text-[12px] leading-none select-none mt-0.5"
                                style={{ color: accentColor }}
                              >
                                •
                              </span>
                              <span className="flex-1">
                                {bullet.includes(':') ? (
                                  <>
                                    <strong>{bullet.split(':')[0]}:</strong>
                                    {bullet.slice(bullet.indexOf(':') + 1)}
                                  </>
                                ) : (
                                  bullet
                                )}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CUSTOM SECTIONS (IF ANY) */}
            {customSections && customSections.length > 0 && (
              <div className="mt-3.5 space-y-3">
                {customSections.map((sec, idx) => (
                  <div key={sec.id || idx}>
                    <h3
                      className="text-xs font-bold uppercase tracking-wider pb-1 mb-2 border-b-2"
                      style={{ color: nameColor, borderColor: accentColor }}
                    >
                      {sec.title}
                    </h3>
                    <p className="text-[10.5px] leading-relaxed text-slate-700">
                      {sec.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);
}

