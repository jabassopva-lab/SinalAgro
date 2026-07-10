
import React, { useState, useEffect } from 'react';
import { CartItem, Order } from '../types';
import { processGoogleDriveLink } from '../utils';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onRemoveItem: (id: string) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  whatsappNumber?: string;
  onPlaceOrder: (order: Order) => void;
  storeName?: string;
  logoUrl?: string;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ 
    isOpen, 
    onClose, 
    cartItems, 
    onRemoveItem, 
    onUpdateQuantity, 
    whatsappNumber = '5566992442998',
    onPlaceOrder,
    storeName = "Sinalização de Segurança",
    logoUrl
}) => {
  const [customerName, setCustomerName] = useState(() => localStorage.getItem('saved_customer_name') || '');
  const [customerPhone, setCustomerPhone] = useState(() => localStorage.getItem('saved_customer_phone') || '');
  const [observations, setObservations] = useState('');
  const [reportOrientation, setReportOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [errors, setErrors] = useState<{name?: string, phone?: string}>({});
  const [orderPlaced, setOrderPlaced] = useState<Order | null>(null);

  useEffect(() => {
      if (isOpen && !orderPlaced) {
          setCustomerName(localStorage.getItem('saved_customer_name') || '');
          setCustomerPhone(localStorage.getItem('saved_customer_phone') || '');
          setObservations('');
      }
  }, [isOpen, orderPlaced]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
    value = value.replace(/(\d)(\d{4})$/, '$1-$2');
    setCustomerPhone(value);
  };

  const validateForm = () => {
      const newErrors: {name?: string, phone?: string} = {};
      let isValid = true;
      if (!customerName.trim()) { newErrors.name = 'Obrigatório'; isValid = false; }
      if (!customerPhone.trim() || customerPhone.length < 14) { newErrors.phone = 'Telefone inválido'; isValid = false; }
      setErrors(newErrors);
      return isValid;
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    if (!validateForm()) return;

    const newOrder: Order = {
        id: Math.random().toString(36).substr(2, 9),
        shortId: `#REL-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: new Date().toISOString(),
        customerName: customerName,
        customerPhone: customerPhone,
        items: [...cartItems],
        status: 'Pendente',
        total: 0,
        paymentMethod: 'consulta',
        observations: observations.trim() || undefined
    };

    onPlaceOrder(newOrder);
    setOrderPlaced(newOrder);
  };

  const generateShareMessage = () => {
    if (!orderPlaced) return "";
    
    let message = `📄 *RELATÓRIO DE ESCOLHAS - ${storeName}*\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `🆔 *ID:* ${orderPlaced.shortId}\n`;
    message += `👤 *Solicitante:* ${orderPlaced.customerName}\n`;
    message += `📅 *Data:* ${new Date().toLocaleDateString('pt-BR')}\n\n`;
    
    message += `📦 *ITENS SELECIONADOS:*\n`;
    orderPlaced.items.forEach((item, index) => {
        const code = item.sign.code || `REF-${item.sign.id.toString().slice(-4)}`;
        message += `\n${index + 1}. *${item.sign.title}* (${code})\n`;
        message += `   📏 Tam: ${item.size} | 🛠️ Mat: ${item.material}\n`;
        message += `   🔢 Qtd: ${item.quantity}\n`;
        if (item.specialSize) message += `   💡 Obs: ${item.specialSize}\n`;
    });

    if (orderPlaced.observations) {
        message += `\n📝 *OBSERVAÇÕES GERAIS:*\n${orderPlaced.observations}\n`;
    }

    message += `\n━━━━━━━━━━━━━━━━━━━━\n`;
    message += `📢 _Sinalização técnica em conformidade com NR 26._`;
    
    return message;
  };

  const handleShareWhatsapp = () => {
    const message = generateShareMessage();
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleShareEmail = () => {
    const subject = `Relatório de Escolhas ${orderPlaced?.shortId} - ${storeName}`;
    const body = generateShareMessage().replace(/\*/g, ''); // Remove negrito do markdown para email
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handlePrintOrder = () => {
    if (!orderPlaced) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsHtml = orderPlaced.items.map(i => {
        const imgSrc = i.customImage || processGoogleDriveLink(i.sign.imageUrl);
        const code = i.sign.code || `REF-${i.sign.id.toString().slice(-4)}`;
        
        let specs = [];
        if (i.specialSize) specs.push(`<strong>OBS/MEDIDA:</strong> ${i.specialSize}`);
        if (i.customText) specs.push(`<strong>TEXTO:</strong> ${i.customText}`);
        if (!i.specialSize && !i.customText) specs.push(i.sign.description);

        return `
            <tr>
                <td style="text-align: center; padding: 10px;">
                    <img src="${imgSrc}" oncontextmenu="return false;" draggable="false" style="width: 80px; height: 80px; object-fit: contain; border: 1px solid #ddd; border-radius: 4px; pointer-events: none; -webkit-user-drag: none; user-select: none;" />
                </td>
                <td style="text-align: center; font-weight: bold; font-family: monospace;">${code}</td>
                <td><strong>${i.sign.title}</strong><br/><small>${i.sign.category}</small></td>
                <td style="text-align: center; font-weight: bold;">${i.size}</td>
                <td style="text-align: center;">${i.material}</td>
                <td style="text-align: center; font-weight: bold;">${i.quantity}</td>
                <td style="font-size: 10px; color: #334155; line-height: 1.2;">
                    ${specs.join('<br/>')}
                </td>
            </tr>
        `;
    }).join('');

    const htmlContent = `
        <html>
        <head>
            <title>Relatório de Escolhas - ${storeName}</title>
            <style>
                @page { size: ${reportOrientation}; margin: 10mm; }
                body { font-family: sans-serif; padding: 20px; color: #333; line-height: 1.4; background: #fff; width: 100%; box-sizing: border-box; } 
                table { width: 100%; border-collapse: collapse; margin-top: 20px; table-layout: fixed; } 
                th, td { border: 1px solid #eee; padding: 8px; text-align: left; font-size: 11px; word-wrap: break-word; } 
                th { background: #f8fafc; text-transform: uppercase; font-size: 9px; color: #64748b; font-weight: 800; }
                .header { text-align: center; border-bottom: 2px solid #0B3C24; padding-bottom: 15px; }
                .logo { max-height: 60px; margin-bottom: 10px; object-fit: contain; }
                .footer { margin-top: 30px; text-align: center; font-size: 9px; color: #94a3b8; border-top: 1px solid #eee; padding-top: 15px; }
                .meta { margin-top: 15px; background: #f1f5f9; padding: 12px; border-radius: 8px; font-size: 11px; display: flex; justify-content: space-between; }
                .compliance-badge { margin-top: 20px; border: 1px solid #008751; background: #f0fdf4; padding: 10px; border-radius: 6px; }
                .compliance-badge h4 { color: #008751; margin: 0 0 4px 0; font-size: 11px; text-transform: uppercase; font-weight: 900; }
                .compliance-badge p { margin: 0; font-size: 10px; color: #166534; font-weight: 500; }
                @media print { .no-print { display: none; } }
            </style>
        </head>
        <body>
            <div class="header">
                ${logoUrl ? `<img src="${logoUrl}" class="logo" />` : ''}
                <h1 style="margin:0; font-size: 18px; color: #0B3C24;">${storeName}</h1>
                <h2 style="margin:4px 0 0 0; font-size: 12px; color: #64748b;">Relatório de Sinalização Técnica</h2>
            </div>
            
            <div class="meta">
                <div>
                    <strong>Solicitante:</strong> ${orderPlaced.customerName}<br/>
                    <strong>Contato:</strong> ${orderPlaced.customerPhone}
                </div>
                <div style="text-align: right;">
                    <strong>Relatório:</strong> ${orderPlaced.shortId}<br/>
                    <strong>Emissão:</strong> ${new Date().toLocaleDateString('pt-BR')}
                </div>
            </div>

            <div class="compliance-badge">
                <h4>✅ Conformidade Normativa NR 26</h4>
                <p>Esta seleção segue os padrões da NR 26 e ISO 7010.</p>
            </div>

            <table>
                <thead>
                    <tr>
                        <th style="width: 85px;">Arte</th>
                        <th style="width: 60px; text-align: center;">Cód.</th>
                        <th style="width: 150px;">Modelo / Categoria</th>
                        <th style="width: 75px; text-align: center;">Tamanho</th>
                        <th style="width: 100px; text-align: center;">Material</th>
                        <th style="width: 40px; text-align: center;">Qtd</th>
                        <th>Especificações / Observações</th>
                    </tr>
                </thead>
                <tbody>${itemsHtml}</tbody>
            </table>

            ${orderPlaced.observations ? `
                <div style="margin-top: 15px; padding: 12px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px;">
                    <strong style="font-size: 10px; color: #92400e; text-transform: uppercase;">Observações Gerais do Relatório:</strong>
                    <p style="margin: 4px 0 0 0; font-size: 11px; color: #78350f;">${orderPlaced.observations}</p>
                </div>
            ` : ''}

            <div class="footer">
                © ${new Date().getFullYear()} ${storeName}
            </div>
            <script>window.onload = function() { setTimeout(function() { window.print(); }, 800); }</script>
        </body>
        </html>`;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <>
      <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
      <div className={`fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className={`px-6 py-5 border-b flex items-center justify-between ${orderPlaced ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-900'}`}>
            <h2 className="text-xl font-bold uppercase tracking-tight">{orderPlaced ? 'Relatório Gerado' : 'Minha Lista'}</h2>
            <button onClick={onClose} className="hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
            </button>
        </div>

        {orderPlaced ? (
            <div className="flex-1 p-6 md:p-8 flex flex-col items-center text-center bg-blue-50/30 overflow-y-auto">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 shadow-sm shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-blue-600"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                </div>
                <h3 className="text-xl font-black text-gray-800 mb-1">Relatório Pronto!</h3>
                <p className="text-slate-500 text-xs mb-6">Seus modelos foram registrados seguindo os padrões da NR 26.</p>
                
                <div className="w-full bg-white p-4 rounded-xl border border-blue-100 shadow-sm mb-4">
                    <label className="block text-[9px] font-black text-slate-400 uppercase mb-3 text-left tracking-widest">Opções de Relatório</label>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setReportOrientation('portrait')}
                            className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase transition-all flex flex-col items-center gap-1 ${reportOrientation === 'portrait' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v16.5h16.5V3.75H3.75Zm1.5 1.5h13.5v13.5H5.25V5.25Z" /></svg>
                            Retrato
                        </button>
                        <button 
                            onClick={() => setReportOrientation('landscape')}
                            className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase transition-all flex flex-col items-center gap-1 ${reportOrientation === 'landscape' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 rotate-90"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v16.5h16.5V3.75H3.75Zm1.5 1.5h13.5v13.5H5.25V5.25Z" /></svg>
                            Paisagem
                        </button>
                    </div>
                </div>

                <div className="w-full grid grid-cols-2 gap-2 mb-6">
                    <button onClick={handleShareWhatsapp} className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs shadow-md transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.374-5.03c0-5.42 4.409-9.816 9.824-9.816 2.625 0 5.092 1.022 6.947 2.877 1.855 1.855 2.876 4.323 2.876 6.946 0 5.421-4.411 9.816-9.828 9.816"/></svg>
                        WhatsApp
                    </button>
                    <button onClick={handleShareEmail} className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-xl text-xs shadow-md transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg>
                        E-mail
                    </button>
                </div>

                <button onClick={handlePrintOrder} className="w-full bg-blue-600 text-white font-black py-4 rounded-xl shadow-lg mb-6 flex items-center justify-center gap-2 uppercase tracking-widest text-sm transition-all hover:brightness-110 active:scale-95">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.198-.54-1.139-1.201l.229-2.523m11.356-8.006a2.25 2.25 0 0 0 2.25-2.25V4.5a2.25 2.25 0 0 0-2.25-2.25h-15A2.25 2.25 0 0 0 2.25 4.5v2.812a2.25 2.25 0 0 0 2.25 2.25" /></svg>
                    Imprimir PDF Normatizado
                </button>
                <button onClick={() => { setOrderPlaced(null); onClose(); }} className="text-blue-600 font-bold text-xs underline">Criar nova lista de escolhas</button>
            </div>
        ) : (
            <>
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {cartItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                            <p className="text-lg font-bold">Sua lista está vazia.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="space-y-3">
                                {cartItems.map(item => (
                                    <div key={item.id} className="flex gap-4 bg-white p-3 rounded-xl border border-slate-100 shadow-sm relative group">
                                        <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center border select-none">
                                            <img src={item.customImage || processGoogleDriveLink(item.sign.imageUrl)} className="max-w-full max-h-full object-contain pointer-events-none select-none" draggable={false} onContextMenu={(e) => e.preventDefault()} alt="Preview" />
                                        </div>
                                        <div className="flex-1 flex flex-col justify-center">
                                            <div className="flex justify-between">
                                                <h3 className="font-bold text-slate-800 text-sm truncate max-w-[150px]">{item.sign.title}</h3>
                                                <span className="text-[9px] font-black text-slate-400 font-mono">#{item.sign.code || item.sign.id.toString().slice(-4)}</span>
                                            </div>
                                            <p className="text-[10px] font-black text-blue-600 uppercase mt-0.5">
                                                {item.size} | {item.material}
                                            </p>
                                            {item.specialSize && (
                                                <p className="text-[9px] font-bold text-amber-600 truncate max-w-[200px]">OBS: {item.specialSize}</p>
                                            )}
                                            <div className="flex items-center gap-4 mt-2">
                                                <div className="flex items-center border rounded h-7 bg-slate-50">
                                                    <button onClick={() => onUpdateQuantity(item.id, -1)} className="px-2 font-bold">-</button>
                                                    <span className="px-3 font-bold text-xs">{item.quantity}</span>
                                                    <button onClick={() => onUpdateQuantity(item.id, 1)} className="px-2 font-bold">+</button>
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={() => onRemoveItem(item.id)} className="absolute top-2 right-2 text-slate-300 hover:text-red-500"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg></button>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b pb-2">Seus Dados</h3>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Seu Nome / Empresa *</label>
                                    <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={`w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:outline-none ${errors.name ? 'border-red-500' : 'border-slate-300'}`} placeholder="Como devemos chamar você?" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">WhatsApp de Contato *</label>
                                    <input type="text" value={customerPhone} onChange={handlePhoneChange} className={`w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:outline-none ${errors.phone ? 'border-red-500' : 'border-slate-300'}`} placeholder="(00) 00000-0000" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Observações Adicionais (Gerais)</label>
                                    <textarea value={observations} onChange={(e) => setObservations(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" placeholder="Ex: Entrega prioritária..." rows={3} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {cartItems.length > 0 && (
                    <div className="p-6 border-t bg-white">
                        <button onClick={handleCheckout} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs">
                            Gerar Relatório de Escolhas
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
                        </button>
                    </div>
                )}
            </>
        )}
      </div>
    </>
  );
};

export default CartDrawer;
