import React from 'react';

interface HeroProps {
  title: string;
  onTitleChange: (newTitle: string) => void;
  isAdminMode: boolean;
}

const Hero: React.FC<HeroProps> = ({ title, onTitleChange, isAdminMode }) => {
  const processTitleHtml = () => {
    if (!title) return '';
    
    const highlightText = "DO TRABALHO";
    
    if (title.includes(highlightText)) {
      return `
        <span class="block text-slate-800 tracking-tight font-black uppercase text-2xl sm:text-3xl lg:text-4xl mb-1 sm:mb-2">
          Sinalização de Segurança
        </span>
        <span class="block mt-1">
          <span class="relative inline-block px-4 py-2">
            <span class="absolute inset-0 bg-gradient-to-r from-brand-blue to-brand-teal rounded-xl -skew-x-3 shadow-[0_6px_20px_rgba(11,60,36,0.25)]"></span>
            <span class="relative text-white font-black italic tracking-tighter text-3xl sm:text-5xl lg:text-6xl uppercase">
              ${highlightText} AGRO
            </span>
          </span>
        </span>
      `;
    }
    return `<span class="font-black text-brand-blue tracking-tight">${title}</span>`;
  };

  return (
    <section className="relative py-12 sm:py-20 lg:py-24 bg-white overflow-hidden border-b border-slate-200">
      {/* Background Decorative Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
           style={{ 
             backgroundImage: `linear-gradient(#008751 1px, transparent 1px), linear-gradient(90deg, #008751 1px, transparent 1px)`,
             backgroundSize: '40px 40px' 
           }}>
      </div>
      
      {/* Ambient Lighting Glows */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-teal/5 rounded-full blur-[100px]"></div>
      <div className="absolute top-1/2 -right-24 w-80 h-80 bg-brand-blue/5 rounded-full blur-[100px]"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
          
          {/* Top Indicator Badge */}
          <div className="inline-flex items-center gap-2 bg-emerald-50/70 border border-emerald-200/50 px-4 py-2 rounded-full shadow-sm mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-teal opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-teal"></span>
            </span>
            <span className="text-[10px] font-black text-brand-teal uppercase tracking-[0.2em] font-display">
              Sinalização Técnica Agro • Portfólio de Conformidade NR-31
            </span>
          </div>

          <div className="max-w-2xl w-full mx-auto">
              <h1
                contentEditable={isAdminMode}
                suppressContentEditableWarning={true}
                onBlur={(e) => isAdminMode && onTitleChange(e.currentTarget.textContent || '')}
                className={`font-display text-slate-950 leading-[1.08] ${isAdminMode ? 'cursor-text focus:outline-none ring-2 ring-brand-teal ring-offset-4 rounded' : ''}`}
                dangerouslySetInnerHTML={{ __html: processTitleHtml() }}
              />
          </div>
          
          <p className="mt-6 text-base sm:text-lg text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto tracking-tight">
            Comunicação visual de altíssima durabilidade projetada especificamente para o campo. Placas normativas para <strong className="text-brand-blue font-bold">silos de grãos, usinas, frotas agrícolas e áreas de defensivos</strong> em total conformidade jurídica com a <span className="text-brand-teal font-black underline decoration-2 decoration-brand-teal/30">Norma Regulamentadora NR-31</span>.
          </p>

          {/* Quick Agro Pillars lists */}
          <div className="mt-8 grid grid-cols-2 sm:flex sm:flex-wrap sm:justify-center gap-2 sm:gap-3 font-display text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-700 w-full max-w-2xl mx-auto">
              <span className="flex items-center justify-center gap-1.5 sm:gap-2 bg-slate-50 border border-slate-200/60 px-2.5 py-2 sm:px-4 sm:py-2 rounded-xl shadow-xs text-center hover:bg-slate-100 transition-colors duration-200">
                  <span className="text-xs sm:text-sm">🌾</span>
                  <span className="truncate">Silos & Armazenamento</span>
              </span>
              <span className="flex items-center justify-center gap-1.5 sm:gap-2 bg-slate-50 border border-slate-200/60 px-2.5 py-2 sm:px-4 sm:py-2 rounded-xl shadow-xs text-center hover:bg-slate-100 transition-colors duration-200">
                  <span className="text-xs sm:text-sm">🚜</span>
                  <span className="truncate">Maquinários e Frotas</span>
              </span>
              <span className="flex items-center justify-center gap-1.5 sm:gap-2 bg-slate-50 border border-slate-200/60 px-2.5 py-2 sm:px-4 sm:py-2 rounded-xl shadow-xs text-center hover:bg-slate-100 transition-colors duration-200">
                  <span className="text-xs sm:text-sm">⚡</span>
                  <span className="truncate">Subestações e Elétrica</span>
              </span>
              <span className="flex items-center justify-center gap-1.5 sm:gap-2 bg-slate-50 border border-slate-200/60 px-2.5 py-2 sm:px-4 sm:py-2 rounded-xl shadow-xs text-center hover:bg-slate-100 transition-colors duration-200">
                  <span className="text-xs sm:text-sm">🛡️</span>
                  <span className="truncate">Área de Defensivos</span>
              </span>
          </div>

          <div className="mt-10 flex items-center gap-3 bg-brand-blue/5 border border-brand-blue/10 px-4 py-3 rounded-2xl max-w-xl mx-auto text-left">
            <span className="text-xl">💡</span>
            <p className="text-xs text-brand-blue font-bold leading-tight">
              Personalizamos todas as placas com as cores oficiais e a logotipo da sua fazenda ou cooperativa agropecuária para fortalecimento de marca.
            </p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-brand-teal/20 to-transparent"></div>
    </section>
  );
};

export default Hero;
