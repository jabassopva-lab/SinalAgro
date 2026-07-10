
import React, { useState } from 'react';
import { Order, OrderStatus } from '../types';
import { processGoogleDriveLink } from '../utils';

interface OrderManagerProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => void;
  onDeleteOrder: (orderId: string) => void;
  storeName?: string;
  isOnline?: boolean;
}

const OrderManager: React.FC<OrderManagerProps> = ({
  isOpen,
  onClose,
  orders,
  onUpdateStatus,
  onDeleteOrder,
  storeName = "Sinalização de Segurança",
  isOnline = false
}) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!isOpen) return null;

  const statusColors: Record<OrderStatus, string> = {
    'Pendente': 'bg-yellow-100 text-yellow-800',
    'Pago': 'bg-blue-100 text-blue-800',
    'Em Produção': 'bg-purple-100 text-purple-800',
    'Enviado': 'bg-orange-100 text-orange-800',
    'Concluído': 'bg-green-100 text-green-800',
    'Cancelado': 'bg-red-100 text-red-800',
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString('pt-BR');

  const handlePrintOrder = () => {
    if (!selectedOrder) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Pedido ${selectedOrder.shortId} - ${storeName}</title>
            <style>
                body { font-family: Arial, sans-serif; font-size: 12px; color: #333; padding: 20px; max-width: 800px; margin: 0 auto; }
                .header { text-align: center; border-bottom: 2px solid #eee; padding-bottom: 15px; margin-bottom: 20px; }
                .header h1 { margin: 0 0 5px 0; font-size: 24px; color: #166534; }
                .header h2 { margin: 0; font-size: 18px; color: #555; }
                .info-grid { display: flex; justify-content: space-between; margin-bottom: 20px; gap: 20px; }
                .info-box { background: #f9fafb; padding: 15px; border-radius: 8px; flex: 1; border: 1px solid #eee; }
                .info-box h3 { margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; color: #166534; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
                .info-row { margin-bottom: 5px; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th { background-color: #166534; color: white; text-align: left; padding: 8px; font-size: 12px; text-transform: uppercase; }
                td { padding: 8px; border-bottom: 1px solid #eee; vertical-align: middle; }
                .total-section { text-align: right; margin-top: 20px; padding-top: 10px; border-top: 2px solid #eee; }
                .grand-total { font-size: 20px; font-weight: bold; color: #166534; }
                .footer { text-align: center; margin-top: 40px; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 10px; }
                .prod-img { width: 60px; height: 60px; object-fit: contain; border: 1px solid #ddd; border-radius: 4px; background: #fff; pointer-events: none; -webkit-user-drag: none; user-select: none; }
                .obs-block { margin-top: 20px; padding: 15px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>${storeName}</h1>
                <h2>Ordem de Produção #${selectedOrder.shortId}</h2>
            </div>
            <div class="info-grid">
                <div class="info-box">
                    <h3>Dados do Cliente</h3>
                    <div><strong>Nome:</strong> ${selectedOrder.customerName}</div>
                    <div><strong>Tel:</strong> ${selectedOrder.customerPhone || 'N/A'}</div>
                </div>
                <div class="info-box">
                    <h3>Pedido</h3>
                    <div><strong>Data:</strong> ${new Date(selectedOrder.createdAt).toLocaleString('pt-BR')}</div>
                    <div><strong>Status:</strong> ${selectedOrder.status}</div>
                </div>
            </div>

            ${selectedOrder.observations ? `
            <div class="obs-block">
                <strong style="text-transform: uppercase; font-size: 10px; color: #92400e;">Observações:</strong><br/>
                <div style="font-size: 12px; margin-top: 5px; color: #78350f;">${selectedOrder.observations}</div>
            </div>` : ''}

            <table>
                <thead>
                    <tr><th>Arte</th><th>Produto</th><th>Qtd</th><th>Unit.</th><th>Total</th></tr>
                </thead>
                <tbody>
                    ${selectedOrder.items.map(item => `
                        <tr>
                            <td><img src="${item.customImage || processGoogleDriveLink(item.sign.imageUrl)}" class="prod-img" oncontextmenu="return false;" draggable="false" /></td>
                            <td><strong>${item.sign.title}</strong><br>${item.size} | ${item.material}</td>
                            <td>${item.quantity}</td>
                            <td>${formatCurrency(item.unitPrice)}</td>
                            <td>${formatCurrency(item.unitPrice * item.quantity)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="total-section">
                <div class="grand-total">TOTAL: ${formatCurrency(selectedOrder.total)}</div>
            </div>
            <div class="footer">
                Documento de controle interno para produção visual.<br/>
                Emitido em: ${new Date().toLocaleString('pt-BR')}
            </div>
            <script>window.onload = function() { window.print(); }</script>
        </body>
        </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleDeleteConfirm = async (id: string) => {
      if (confirmDeleteId !== id) {
          setConfirmDeleteId(id);
          // Auto-cancela confirmação após 4 segundos se não clicar de novo
          setTimeout(() => setConfirmDeleteId(null), 4000);
          return;
      }

      setIsDeleting(true);
      try {
          await onDeleteOrder(id);
          setSelectedOrder(null);
          setConfirmDeleteId(null);
      } catch (err) {
          alert("Erro ao excluir pedido. Tente novamente.");
      } finally {
          setIsDeleting(false);
      }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 md:p-3 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full md:w-[98vw] h-[95vh] md:h-[96vh] max-w-none rounded-xl shadow-2xl overflow-hidden animate-fade-in-up flex flex-col">
        
        {/* Header */}
        <div className="bg-slate-800 text-white p-6 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" /></svg>
              Gestão de Pedidos
            </h2>
            <p className="text-slate-300 text-sm">Controle de vendas e produção.</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="bg-emerald-50 border-b border-emerald-100 p-3 flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-blue-400'}`}></div>
            <div className="text-xs text-emerald-800 font-bold">
                {isOnline ? '🟢 ONLINE: Sincronizado com Supabase.' : '🔵 OFFLINE: Pedidos locais.'}
            </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Lista de Pedidos (Esquerda) */}
          <div className={`w-full ${selectedOrder ? 'hidden md:block md:w-1/3 border-r' : ''} bg-gray-50 flex flex-col overflow-y-auto custom-scrollbar`}>
            {orders.length === 0 ? (
              <div className="p-8 text-center text-gray-400 font-medium">Nenhum pedido encontrado.</div>
            ) : (
              orders.map((order) => (
                <div 
                  key={order.id} 
                  onClick={() => setSelectedOrder(order)}
                  className={`p-4 border-b cursor-pointer transition-all ${selectedOrder?.id === order.id ? 'bg-white border-l-4 border-l-blue-600 shadow-sm' : 'border-gray-200 hover:bg-gray-100'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-gray-800">{order.shortId}</span>
                    <span className="text-[10px] text-gray-400">{formatDate(order.createdAt)}</span>
                  </div>
                  <div className="font-bold text-sm text-gray-700 truncate">{order.customerName}</div>
                  <div className="flex justify-between items-center mt-2">
                    <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded shadow-sm ${statusColors[order.status]}`}>
                      {order.status}
                    </span>
                    <span className="font-black text-theme-green-700">{formatCurrency(order.total)}</span>
                  </div>
                  {typeof order.commission === 'number' && order.commission > 0 && (
                      <div className="mt-2 text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 w-fit uppercase">
                          Comissão: {formatCurrency(order.commission)}
                      </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Detalhes do Pedido (Direita) */}
          <div className={`w-full ${!selectedOrder ? 'hidden md:flex items-center justify-center bg-gray-100' : 'flex flex-col md:w-2/3 bg-white'} overflow-y-auto custom-scrollbar`}>
            {selectedOrder ? (
              <div className="p-6">
                <div className="flex justify-between items-start mb-6 border-b pb-4">
                  <div>
                    <button onClick={() => setSelectedOrder(null)} className="md:hidden text-xs bg-gray-100 px-3 py-1 rounded-full text-blue-600 mb-4 font-bold border border-blue-100 shadow-sm">&larr; Voltar para Lista</button>
                    <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Pedido {selectedOrder.shortId}</h3>
                    <p className="text-gray-500 text-xs font-bold uppercase">{formatDate(selectedOrder.createdAt)}</p>
                  </div>
                  <div className="text-right">
                     <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Alterar Status</label>
                     <select 
                        value={selectedOrder.status}
                        onChange={(e) => onUpdateStatus(selectedOrder.id, e.target.value as OrderStatus)}
                        className="border-2 border-gray-200 rounded-lg p-2 text-sm font-black bg-gray-50 text-slate-800 outline-none focus:border-blue-500"
                     >
                        {Object.keys(statusColors).map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                     </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-8">
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-sm">
                    <h4 className="font-black text-slate-400 mb-3 text-[10px] uppercase tracking-widest">Informações do Cliente</h4>
                    <div className="space-y-1 text-sm">
                        <p><strong>Nome:</strong> {selectedOrder.customerName}</p>
                        <p><strong>WhatsApp:</strong> {selectedOrder.customerPhone || 'N/A'}</p>
                        <p><strong>Documento:</strong> {selectedOrder.customerDoc || 'N/A'}</p>
                        <p className="mt-2 text-xs text-gray-500 italic"><strong>Endereço:</strong> {selectedOrder.customerAddress || 'Retirada'}</p>
                    </div>
                  </div>
                  <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-100 flex flex-col justify-center items-center shadow-sm">
                     <span className="text-emerald-600 text-[10px] uppercase font-black tracking-widest mb-1">Valor Total do Pedido</span>
                     <span className="text-4xl font-black text-emerald-700">{formatCurrency(selectedOrder.total)}</span>
                     <p className="text-[10px] font-bold text-emerald-600 mt-2 bg-white px-2 py-0.5 rounded-full border border-emerald-200 uppercase">{selectedOrder.paymentMethod}</p>
                  </div>
                </div>

                {selectedOrder.observations && (
                    <div className="mb-8 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                        <h4 className="font-black text-amber-800 mb-1 text-[10px] uppercase tracking-widest">Observações da Venda</h4>
                        <p className="text-sm text-amber-900 leading-relaxed italic">"{selectedOrder.observations}"</p>
                    </div>
                )}

                <h4 className="font-black text-slate-800 mb-4 text-xs uppercase tracking-widest border-b pb-2">Itens da Ordem</h4>
                <div className="space-y-3 mb-10">
                    {selectedOrder.items.map((item, idx) => (
                        <div key={idx} className="flex gap-4 border-2 border-slate-50 p-4 rounded-xl hover:border-blue-100 hover:bg-blue-50/20 transition-all group">
                            <div className="w-20 h-20 bg-white rounded-lg flex-shrink-0 overflow-hidden border shadow-sm flex items-center justify-center p-1 select-none">
                                <img src={item.customImage || processGoogleDriveLink(item.sign.imageUrl)} className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform pointer-events-none select-none" draggable={false} onContextMenu={(e) => e.preventDefault()} alt="Preview" />
                            </div>
                            <div className="flex-1">
                                <h5 className="font-black text-slate-800 text-sm uppercase leading-tight">{item.sign.title}</h5>
                                <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase">{item.size} | {item.material}</p>
                                {item.customText && <p className="text-xs text-blue-600 mt-2 font-black italic bg-blue-100/50 px-2 py-1 rounded border border-blue-100 w-fit">TEXTO: "{item.customText}"</p>}
                            </div>
                            <div className="text-right flex flex-col justify-center">
                                <div className="text-[10px] font-bold text-slate-400 uppercase">{item.quantity} UN x {formatCurrency(item.unitPrice)}</div>
                                <div className="font-black text-slate-800 text-lg">{formatCurrency(item.quantity * item.unitPrice)}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-8 border-t-2 border-dashed">
                    <button 
                        onClick={handlePrintOrder}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-black py-3 px-6 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all uppercase tracking-wider"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.198-.54-1.139-1.201l.229-2.523m11.356-8.006a2.25 2.25 0 0 0 2.25-2.25V4.5a2.25 2.25 0 0 0-2.25-2.25h-15A2.25 2.25 0 0 0 2.25 4.5v2.812a2.25 2.25 0 0 0 2.25 2.25" /></svg>
                        Gerar Ordem de Produção
                    </button>

                    <button 
                        disabled={isDeleting}
                        onClick={() => handleDeleteConfirm(selectedOrder.id)}
                        className={`text-xs font-black flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 transition-all uppercase tracking-wider shadow-sm ${confirmDeleteId === selectedOrder.id ? 'bg-red-600 text-white border-red-600 animate-pulse' : 'text-red-500 border-red-100 hover:bg-red-50'}`}
                    >
                        {isDeleting ? (
                             <span className="flex items-center gap-2"><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div> EXCLUINDO...</span>
                        ) : confirmDeleteId === selectedOrder.id ? (
                             'CLIQUE PARA CONFIRMAR!'
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                                Excluir Pedido
                            </>
                        )}
                    </button>
                </div>
              </div>
            ) : (
              <div className="text-slate-400 text-center p-20 flex flex-col items-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border-2 border-slate-100">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-10 h-10 opacity-30"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" /></svg>
                </div>
                <p className="font-bold text-sm uppercase tracking-widest">Selecione um pedido para gerenciar</p>
                <p className="text-xs mt-1">Visualize detalhes, altere o status ou gere o PDF de produção.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderManager;
