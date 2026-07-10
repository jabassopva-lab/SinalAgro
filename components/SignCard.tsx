
import React, { useRef, useState, useEffect, useMemo, memo } from 'react';
import { Sign, SignCategory, MaterialType } from '../types';
import { processGoogleDriveLink } from '../utils';

interface SignCardProps {
  sign: Sign;
  onClick: () => void;
  onSignContentChange: (signId: number, field: 'title' | 'description', value: string) => void;
  onImageUpload: (signId: number, file: File) => void;
  onDeleteSign?: (signId: number) => void;
  isAdminMode: boolean;
  isSubscriber?: boolean;
  onToggleVisibility?: () => void;
  onApproveSign?: (signId: number, category: SignCategory) => void;
  materialPrices?: Record<MaterialType, number>;
  priceMultiplier?: number;
}

const categoryStyles: { [key: string]: string } = {
  [SignCategory.Custom]: 'border-purple-800 border-4 hover:border-purple-900 ring-2 ring-purple-300/50 shadow-md',
  [SignCategory.Warning]: 'border-blue-700/50 hover:border-blue-700',
  [SignCategory.Attention]: 'border-safety-yellow/50 hover:border-safety-yellow',
  [SignCategory.Danger]: 'border-safety-red/50 hover:border-safety-red',
  [SignCategory.Mandatory]: 'border-safety-blue/50 hover:border-safety-blue',
  [SignCategory.Prohibition]: 'border-safety-red/50 hover:border-safety-red',
  [SignCategory.Emergency]: 'border-safety-green/50 hover:border-safety-green',
  [SignCategory.Traffic]: 'border-orange-500/50 hover:border-orange-500',
  [SignCategory.Security]: 'border-teal-500/50 hover:border-teal-500',
  [SignCategory.Fire]: 'border-red-700/50 hover:border-red-700',
  [SignCategory.Info]: 'border-blue-800/50 hover:border-blue-800',
};

const SignCard: React.FC<SignCardProps> = ({ 
    sign, 
    onClick, 
    isAdminMode,
    onDeleteSign,
    onToggleVisibility
}) => {
  const cardStyle = categoryStyles[sign.category] || categoryStyles[SignCategory.Warning];
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageError, setImageError] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  const isCustom = sign.category === SignCategory.Custom || sign.category === 'Placas Editável';
  const displayImageUrl = useMemo(() => processGoogleDriveLink(sign.imageUrl), [sign.imageUrl]);
  
  const isCanvasTemplate = !displayImageUrl || 
                           displayImageUrl.includes('via.placeholder') || 
                           displayImageUrl.includes('150?text=NOVA') ||
                           imageError;

  const isHidden = sign.isHidden;
  const displayCode = sign.code || sign.id.toString().slice(-4);

  const handleMouseLeave = () => {
    if (confirmDelete) setConfirmDelete(false);
  };

  useEffect(() => {
    if (isCanvasTemplate && canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const width = 800; const height = 600; canvas.width = width; canvas.height = height;
        ctx.clearRect(0, 0, width, height);

        const margin = 10;
        const innerMargin = 22;
        const borderRadius = 40;

        ctx.fillStyle = '#FFFFFF'; 
        ctx.beginPath();
        ctx.roundRect(margin, margin, 780, 580, borderRadius);
        ctx.fill();

        ctx.strokeStyle = '#000000'; 
        ctx.lineWidth = 7;
        ctx.stroke();
        
        let headerColor = '#2563EB'; // AZUL FORTE (antes era #009BA5)
        let headerText = 'AVISO';
        let textColor = '#FFFFFF';
        let isDanger = false;

        const cat = (sign.category || '').toUpperCase();
        // LÓGICA DE DETECÇÃO CORRIGIDA: Inclui a descrição para diferenciar templates editáveis
        const content = (sign.title + ' ' + (sign.description || '') + ' ' + (sign.category || '')).toUpperCase();
        
        if (content.includes('PROIBIDO') || cat === 'PROIBIÇÃO') {
            headerColor = '#DC2626'; headerText = 'PROIBIDO';
        } else if (content.includes('PERIGO') || cat === 'PERIGO') {
            isDanger = true; headerText = 'PERIGO';
        } else if (content.includes('ATENÇÃO') || cat === 'ATENÇÃO') {
            headerColor = '#FFD700'; headerText = 'ATENÇÃO'; textColor = '#000000';
        } else if (content.includes('SEGURANÇA') || cat === 'SEGURANÇA') {
            headerColor = '#16A34A'; headerText = 'SEGURANÇA';
        }

        if (isDanger) {
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.roundRect(innerMargin, innerMargin, 756, 160, 25);
            ctx.fill();

            ctx.fillStyle = '#DC2626';
            ctx.beginPath();
            ctx.ellipse(width/2, 102, 340, 65, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 5;
            ctx.stroke();
        } else {
            ctx.fillStyle = headerColor;
            ctx.beginPath();
            ctx.roundRect(innerMargin, innerMargin, 756, 160, 25);
            ctx.fill();
        }

        ctx.fillStyle = textColor;
        ctx.font = 'bold 105px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(headerText, width/2, 105);

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 70px Arial';
        const words = sign.title.split(' ');
        if (words.length > 2) {
            ctx.fillText(words.slice(0, 2).join(' '), width/2, 340);
            ctx.fillText(words.slice(2).join(' '), width/2, 440);
        } else {
            ctx.fillText(sign.title, width/2, 380);
        }
    }
  }, [isCanvasTemplate, sign.title, sign.description, sign.category, imageError]);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDeleteSign) return;

    if (confirmDelete) {
        onDeleteSign(sign.id);
        setConfirmDelete(false);
    } else {
        setConfirmDelete(true);
        setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleVisibility) onToggleVisibility();
  };

  return (
    <div 
      className={`group ${isCustom ? 'bg-purple-50' : 'bg-white'} rounded-lg shadow-sm overflow-hidden cursor-pointer border transition-all duration-300 transform hover:shadow-md hover:-translate-y-1 flex flex-col h-full ${cardStyle} ${isHidden ? 'opacity-50 grayscale' : ''} relative`} 
      onClick={onClick}
      onMouseLeave={handleMouseLeave}
    >
      {isAdminMode && (
          <div className="absolute top-2 left-2 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                  onClick={handleDelete}
                  className={`${confirmDelete ? 'bg-green-600 animate-pulse' : 'bg-red-600'} text-white p-1.5 rounded-md shadow-lg hover:brightness-110 transition-all flex items-center gap-1 min-w-[32px] justify-center`}
                  title={confirmDelete ? "Clique novamente para confirmar" : "Excluir Placa"}
              >
                  {confirmDelete ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                  ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                  )}
              </button>
              <button 
                  onClick={handleToggle}
                  className="bg-slate-700 text-white p-1.5 rounded-md shadow-lg hover:bg-slate-900 transition-colors"
                  title={isHidden ? "Mostrar Placa" : "Esconder Placa"}
              >
                  {isHidden ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                  ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                  )}
              </button>
          </div>
      )}

      <div className="relative overflow-hidden p-1.5 flex-grow flex items-center justify-center aspect-[4/3] select-none bg-slate-50">
        {isCanvasTemplate ? (
             <canvas ref={canvasRef} className="w-full h-full object-contain drop-shadow-sm pointer-events-none" />
        ) : (
            <img 
              src={displayImageUrl} 
              alt={sign.title} 
              className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105 pointer-events-none select-none" 
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
              onError={() => setImageError(true)}
            />
        )}
        <div className="absolute top-2 right-2 z-10">
            <span className="bg-slate-900/80 text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded backdrop-blur-sm border border-white/20">
                #{displayCode}
            </span>
        </div>
      </div>
      <div className="p-2 flex flex-col flex-1">
        <span className="inline-block px-1.5 py-0.5 rounded-[3px] text-[7px] font-bold uppercase tracking-tight bg-gray-100 text-gray-500 mb-0.5 w-fit">{sign.category}</span>
        <h3 className="font-bold text-xs sm:text-[13px] text-slate-800 leading-tight mb-1 line-clamp-2 min-h-[2.1em] uppercase">{sign.title}</h3>
        <div className="mt-auto flex items-center justify-between pt-1 border-t border-gray-100">
            <span className="text-[9px] text-slate-400 font-bold uppercase">{isCustom ? 'Personalizar' : 'Ver detalhes'}</span>
            <div className="bg-brand-teal text-white p-1 rounded-md shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            </div>
        </div>
      </div>
    </div>
  );
};

export default memo(SignCard);
