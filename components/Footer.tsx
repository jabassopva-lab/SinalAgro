import React from 'react';

interface FooterProps {
    whatsappNumber?: string;
    storeName?: string;
    resellerName?: string; 
}

const Footer: React.FC<FooterProps> = ({ whatsappNumber = '5566992442998', storeName = 'Sinalização de Segurança', resellerName }) => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-industrial-900 border-t border-industrial-800 relative text-gray-400">
      <div className="h-3 w-full bg-safety-stripes border-b border-black/30"></div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <div className="flex flex-col items-center justify-center mb-4">
             <div className="bg-white/5 p-3 rounded-full mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-safety-yellow">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
                </svg>
             </div>
             <p className="font-display font-bold text-white text-lg tracking-wide uppercase">{storeName}</p>
             <p className="text-xs text-gray-500">Especialistas em Comunicação Visual & Sinalização Normatizada</p>
        </div>

        <div className="h-px w-24 bg-industrial-800 mx-auto mb-4"></div>

        {resellerName && (
            <div className="mb-4 inline-block bg-industrial-800 px-4 py-2 rounded-lg border border-industrial-700">
                <p className="text-xs text-gray-400">Atendimento / Vendedor:</p>
                <p className="text-sm font-bold text-safety-yellow">{resellerName.toUpperCase()}</p>
            </div>
        )}

        <p className="text-sm">&copy; {currentYear}. Todos os direitos reservados.</p>
        <div className="mt-2 text-xs">
          <a href="/privacy.html" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-safety-yellow transition-colors underline decoration-dotted">
            Política de Privacidade
          </a>
        </div>
      </div>
      
      <div className="bg-industrial-950 py-2 text-center">
          <p className="text-[10px] text-industrial-700 font-mono">SYSTEM ID: {Math.random().toString(36).substr(2, 6).toUpperCase()}-V2</p>
      </div>
    </footer>
  );
};

export default Footer;