
import React, { useState, useRef, useEffect } from 'react';
import { Sign, SignCategory, SizeType, MaterialType, Subscriber, CartItem } from '../types';
import { processGoogleDriveLink } from '../utils';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    sign: Sign | null;
    isAdminMode: boolean;
    isSubscriber: boolean;
    currentSubscriber: Subscriber | null;
    onAddToCart: (item: CartItem) => void;
    onPrint: (sign: Sign, size: string) => void;
    onUpdateSign?: (id: number, data: Partial<Sign>) => void;
}

const Modal: React.FC<ModalProps> = ({ 
    isOpen, 
    onClose, 
    sign, 
    isAdminMode, 
    isSubscriber, 
    currentSubscriber, 
    onAddToCart,
    onPrint,
    onUpdateSign
}) => {
    const [customizationMode, setCustomizationMode] = useState<'text' | 'image'>('text');
    const [customText, setCustomText] = useState('');
    const [customImage, setCustomImage] = useState<string | null>(null);
    const [selectedSize, setSelectedSize] = useState<SizeType>('24x34cm');
    const [selectedMaterial, setSelectedMaterial] = useState<MaterialType>('Vinil Adesivo');
    const [specialSize, setSpecialSize] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [imgError, setImgError] = useState(false);
    
    // Estados de edição admin
    const [editTitle, setEditTitle] = useState('');
    const [editCategory, setEditCategory] = useState('');
    const [editCode, setEditCode] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const isEditable = sign?.category === SignCategory.Custom || sign?.category === 'Placas Editável';

    useEffect(() => {
        if (isOpen && sign) {
            setQuantity(1); 
            setCustomText(''); 
            setCustomImage(null); 
            setCustomizationMode('text'); 
            setImgError(false);
            setSpecialSize('');
            setSelectedMaterial('Vinil Adesivo');
            
            // Inicializa valores de edição admin
            setEditTitle(sign.title);
            setEditCategory(sign.category);
            setEditCode(sign.code || '');
            
            document.body.style.overflow = 'hidden';
        } else { 
            document.body.style.overflow = 'unset'; 
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen, sign]);

    const displayImageUrl = sign ? processGoogleDriveLink(sign.imageUrl) : '';
    const hasValidImage = (displayImageUrl && displayImageUrl.length > 10 && !displayImageUrl.includes('via.placeholder') && !displayImageUrl.includes('text=NOVA'));
    
    const showCustomImage = customizationMode === 'image' && !!customImage;
    const showCanvas = isEditable && customizationMode === 'text' || (!hasValidImage && !showCustomImage);
    const displayCode = sign ? (sign.code || sign.id.toString().slice(-4)) : '';

    useEffect(() => {
        if (isOpen && sign && showCanvas && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            let headerColor = '#2563EB'; 
            let headerText = 'AVISO'; 
            let headerTextColor = '#FFFFFF';
            let isDangerHeader = false;
            
            const categoryToUse = isAdminMode ? editCategory : sign.category;
            const titleToUse = isAdminMode ? editTitle : sign.title;
            const descriptionToUse = sign.description || '';
            
            const contentToCheck = (categoryToUse + ' ' + titleToUse + ' ' + descriptionToUse).toUpperCase();
            
            if (contentToCheck.includes('PROIBIDO') || categoryToUse === 'Proibição') {
                headerColor = '#DC2626'; headerText = 'PROIBIDO';
            } else if (contentToCheck.includes('PERIGO') || categoryToUse === 'Perigo') { 
                isDangerHeader = true; headerText = 'PERIGO'; 
            } else if (contentToCheck.includes('ATENÇÃO') || categoryToUse === 'Atenção') { 
                headerColor = '#FFD700'; headerText = 'ATENÇÃO'; headerTextColor = '#000000'; 
            } else if (contentToCheck.includes('SEGURANÇA') || categoryToUse === 'SEGURANÇA') { 
                headerColor = '#16a34a'; headerText = 'SEGURANÇA'; 
            }

            canvas.width = 800; 
            canvas.height = 600;
            const borderRadius = 40;
            const margin = 10;
            const innerMargin = 22;
            
            ctx.fillStyle = '#FFFFFF'; 
            ctx.beginPath();
            ctx.roundRect(margin, margin, 780, 580, borderRadius);
            ctx.fill();

            ctx.strokeStyle = '#000000'; 
            ctx.lineWidth = 7; 
            ctx.stroke();
            
            if (isDangerHeader) {
                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.roundRect(innerMargin, innerMargin, 756, 160, 25);
                ctx.fill();

                ctx.fillStyle = '#DC2626';
                ctx.beginPath();
                ctx.ellipse(400, 102, 340, 65, 0, 0, Math.PI * 2);
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

            ctx.fillStyle = headerTextColor; 
            ctx.font = 'bold 105px Arial'; 
            ctx.textAlign = 'center'; 
            ctx.textBaseline = 'middle'; 
            ctx.fillText(headerText, 400, 105);
            
            let bodyText = (customText || titleToUse || 'DIGITE SUA MENSAGEM').toUpperCase();
            ctx.fillStyle = '#000000';
            ctx.textAlign = 'center';

            const maxWidth = 730;
            const maxHeight = 380;
            const lineHeight = 1.1;
            let currentFontSize = 150;
            let lines: string[] = [];
            let totalHeight = 0;

            const calculateLayout = (fontSize: number) => {
                ctx.font = `bold ${fontSize}px Arial`;
                const words = bodyText.split(/\s+/);
                const tempLines: string[] = [];
                let currentLine = '';

                for (let n = 0; n < words.length; n++) {
                    const word = words[n];
                    const testLine = currentLine ? currentLine + ' ' + word : word;
                    const metrics = ctx.measureText(testLine);
                    
                    if (ctx.measureText(word).width > maxWidth) return { tooWide: true, lines: [] };

                    if (metrics.width > maxWidth && n > 0) {
                        tempLines.push(currentLine);
                        currentLine = word;
                    } else {
                        currentLine = testLine;
                    }
                }
                tempLines.push(currentLine);
                return { tooWide: false, lines: tempLines, height: tempLines.length * (fontSize * lineHeight) };
            };

            let layout = calculateLayout(currentFontSize);
            while ((layout.tooWide || (layout.height && layout.height > maxHeight)) && currentFontSize > 20) {
                currentFontSize -= 2;
                layout = calculateLayout(currentFontSize);
            }

            lines = layout.lines;
            totalHeight = layout.height || 0;

            const startY = 185 + (maxHeight - totalHeight) / 2 + (currentFontSize / 1.3);
            lines.forEach((line, index) => {
                ctx.fillText(line.trim(), 400, startY + (index * currentFontSize * lineHeight));
            });
        }
    }, [isOpen, sign, showCanvas, customText, customizationMode, editTitle, editCategory, isAdminMode]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setCustomImage(event.target?.result as string);
                setCustomizationMode('image');
            };
            reader.readAsDataURL(file);
        }
    };

    const getFinalCustomImage = () => {
        if (customizationMode === 'image' && customImage) {
            return customImage;
        }
        if (showCanvas && canvasRef.current) {
            return canvasRef.current.toDataURL('image/png');
        }
        return undefined;
    };

    const saveAdminChanges = () => {
        if (!onUpdateSign || !sign) return;
        setIsSaving(true);
        onUpdateSign(sign.id, {
            title: editTitle,
            category: editCategory,
            code: editCode
        });
        setTimeout(() => {
            setIsSaving(false);
            alert(`✅ Placa movida para: ${editCategory.toUpperCase()}`);
        }, 300);
    };

    if (!isOpen || !sign) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[98vh] relative" onClick={e => e.stopPropagation()}>
                
                <div className="relative h-56 md:h-auto md:w-1/2 bg-slate-100 flex items-center justify-center p-4 border-b md:border-b-0 md:border-r border-gray-200">
                    <div className="absolute top-4 left-4 z-20 bg-slate-900 text-white text-[10px] font-black px-3 py-1 rounded shadow-lg uppercase tracking-widest border border-white/20">
                        REF: #{editCode || displayCode}
                    </div>
                    
                    {showCanvas ? (
                        <canvas ref={canvasRef} className="max-h-full max-w-full object-contain shadow-lg bg-white rounded-lg" />
                    ) : (
                        <img 
                            src={showCustomImage ? customImage! : displayImageUrl} 
                            alt={sign.title} 
                            className="max-h-full max-w-full object-contain drop-shadow-xl pointer-events-none select-none" 
                            draggable={false}
                            onContextMenu={(e) => e.preventDefault()}
                            onError={() => setImgError(true)} 
                        />
                    )}
                </div>

                <div className="p-5 md:p-8 md:w-1/2 overflow-y-auto custom-scrollbar flex flex-col bg-white">
                    <button onClick={onClose} className="absolute top-4 right-4 z-30 text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                    </button>

                    <div className="mb-6">
                        <span className="text-[10px] font-black text-brand-teal uppercase tracking-[0.2em] mb-1 block">{isAdminMode ? editCategory : sign.category}</span>
                        <h2 className="text-xl md:text-2xl font-display font-black text-slate-900 leading-tight uppercase">{isAdminMode ? editTitle : sign.title}</h2>
                    </div>

                    <div className="space-y-6">
                        {/* PAINEL ADMIN: Reorganização de Catálogo */}
                        {isAdminMode && (
                            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-700 shadow-xl animate-fade-in mb-4">
                                <h4 className="text-white text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                                    ⚙️ Reorganizar no Catálogo
                                </h4>
                                
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-[9px] text-slate-400 uppercase font-black ml-1">Novo Nome da Placa</label>
                                        <input 
                                            type="text" 
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs font-bold focus:border-brand-teal outline-none"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-[9px] text-slate-400 uppercase font-black ml-1">Mover para Categoria</label>
                                            <select 
                                                value={editCategory}
                                                onChange={(e) => setEditCategory(e.target.value)}
                                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs font-bold focus:border-brand-teal outline-none"
                                            >
                                                {Object.values(SignCategory).map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[9px] text-slate-400 uppercase font-black ml-1">Cód. Referência</label>
                                            <input 
                                                type="text" 
                                                value={editCode}
                                                onChange={(e) => setEditCode(e.target.value)}
                                                placeholder="#0000"
                                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs font-bold focus:border-brand-teal outline-none"
                                            />
                                        </div>
                                    </div>
                                    <button 
                                        onClick={saveAdminChanges}
                                        disabled={isSaving}
                                        className="w-full bg-brand-teal hover:bg-teal-500 text-white font-black py-2.5 rounded-lg text-[10px] uppercase shadow-lg transition-all"
                                    >
                                        {isSaving ? 'Processando...' : 'Aplicar Reorganização'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {isEditable && (
                            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 animate-fade-in">
                                <div className="flex gap-2 mb-4">
                                    <button 
                                        onClick={() => setCustomizationMode('text')}
                                        className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${customizationMode === 'text' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-200'}`}
                                    >
                                        Texto Personalizado
                                    </button>
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${customizationMode === 'image' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-200'}`}
                                    >
                                        Enviar Logo/Foto
                                    </button>
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                                </div>

                                {customizationMode === 'text' ? (
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-blue-600 uppercase tracking-widest ml-1">Mensagem da Placa</label>
                                        <textarea 
                                            value={customText}
                                            onChange={(e) => setCustomText(e.target.value)}
                                            placeholder="Digite aqui o texto que deseja na placa..."
                                            className="w-full border-2 border-blue-200 rounded-xl p-3 text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none resize-none h-24 font-bold text-slate-800"
                                            maxLength={150}
                                        />
                                        <p className="text-[9px] text-slate-400 italic">O sistema ajustará o tamanho do texto automaticamente.</p>
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        {customImage ? (
                                            <button onClick={() => setCustomImage(null)} className="text-xs text-red-500 font-bold underline">Remover Imagem e Usar Texto</button>
                                        ) : (
                                            <p className="text-xs text-slate-500 font-medium leading-tight">Envie sua arte pronta ou logo da empresa para aplicarmos na placa.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[9px] text-slate-400 block mb-1 font-black uppercase tracking-widest ml-1">Tamanho Padrão</label>
                                <select 
                                    value={selectedSize} 
                                    onChange={(e) => setSelectedSize(e.target.value as SizeType)} 
                                    className="w-full text-xs border-2 border-slate-100 rounded-xl p-3 font-black bg-slate-50 text-slate-800 focus:border-brand-teal outline-none transition-colors"
                                >
                                    <option value="24x34cm">Pequeno (24x34cm)</option>
                                    <option value="30x44cm">Médio (30x44cm)</option>
                                    <option value="40x60cm">Grande (40x60cm)</option>
                                    <option value="60x80cm">Extra (60x80cm)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[9px] text-slate-400 block mb-1 font-black uppercase tracking-widest ml-1">Material</label>
                                <select 
                                    value={selectedMaterial} 
                                    onChange={(e) => setSelectedMaterial(e.target.value as MaterialType)} 
                                    className="w-full text-xs border-2 border-slate-100 rounded-xl p-3 font-black bg-slate-50 text-slate-800 focus:border-brand-teal outline-none transition-colors"
                                >
                                    <option value="Vinil Adesivo">Vinil Adesivo</option>
                                    <option value="PVC 2mm">PVC 2mm</option>
                                    <option value="PVC 3mm">PVC 3mm</option>
                                    <option value="ACM 3mm">ACM 3mm</option>
                                    <option value="Banner Impresso">Banner Impresso</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-[9px] text-slate-400 block mb-1 font-black uppercase tracking-widest ml-1">Quantidade</label>
                            <div className="flex items-center bg-slate-50 border-2 border-slate-100 rounded-xl overflow-hidden max-w-[150px]">
                                <button onClick={() => setQuantity(Math.max(1, quantity-1))} className="flex-1 py-3 text-slate-400 hover:text-slate-900 transition-colors font-black">-</button>
                                <span className="flex-1 text-center font-black text-sm text-slate-800">{quantity}</span>
                                <button onClick={() => setQuantity(quantity+1)} className="flex-1 py-3 text-slate-400 hover:text-slate-900 transition-colors font-black">+</button>
                            </div>
                        </div>

                        <div>
                            <label className="text-[9px] text-slate-400 block mb-1 font-black uppercase tracking-widest ml-1">Medida Especial / Outras Observações (Opcional)</label>
                            <input 
                                type="text"
                                value={specialSize}
                                onChange={(e) => setSpecialSize(e.target.value)}
                                placeholder="Ex: 50x70cm, material especial, recorte personalizado..."
                                className="w-full text-xs border-2 border-slate-100 rounded-xl p-4 font-bold bg-slate-50 text-slate-800 focus:border-brand-teal outline-none transition-colors"
                            />
                        </div>

                        <button 
                            onClick={() => { 
                                onAddToCart({ 
                                    id: Math.random().toString(36).substr(2, 9), 
                                    sign, 
                                    material: selectedMaterial, 
                                    size: selectedSize,
                                    specialSize: specialSize.trim() || undefined,
                                    quantity, 
                                    unitPrice: 0,
                                    customText: customizationMode === 'text' ? customText : undefined,
                                    customImage: getFinalCustomImage() 
                                }); 
                                onClose(); 
                            }} 
                            className="w-full bg-brand-teal hover:bg-slate-900 text-white font-black py-4 rounded-2xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-95 uppercase tracking-widest text-sm flex items-center justify-center gap-3"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                            Adicionar à Minha Lista
                        </button>
                        
                        <p className="text-[10px] text-center text-slate-400 font-medium">Sinalização técnica em conformidade com NR 26 e ISO 7010.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Modal;
