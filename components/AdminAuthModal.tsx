
import React, { useState, useEffect } from 'react';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => void;
}

const AdminAuthModal: React.FC<AdminAuthModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    onConfirm(password);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-brand-blue p-6 text-center text-white relative">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3 border border-white/20">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
            </div>
            <h2 className="text-xl font-display font-black uppercase tracking-tight">Acesso Restrito</h2>
            <p className="text-blue-100 text-xs mt-1">Área exclusiva para administração</p>
            
            <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
            </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-4">
            <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest ml-1">Senha de Acesso</label>
                <input 
                    type="password" 
                    autoFocus
                    value={password}
                    onChange={(e) => {
                        setPassword(e.target.value);
                        setError(false);
                    }}
                    className={`w-full border-2 rounded-xl p-4 text-center text-lg font-mono tracking-[0.5em] outline-none transition-all ${error ? 'border-red-500 bg-red-50' : 'border-slate-100 focus:border-brand-teal bg-slate-50'}`}
                    placeholder="••••••••"
                />
                {error && <p className="text-[10px] text-red-500 font-bold mt-2 text-center uppercase tracking-tighter">❌ Senha incorreta. Tente novamente.</p>}
            </div>

            <button 
                type="submit"
                className="w-full bg-brand-blue hover:bg-slate-900 text-white font-black py-4 rounded-xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-95 uppercase tracking-widest text-sm"
            >
                Entrar no Painel
            </button>
            
            <p className="text-[9px] text-center text-slate-400 font-medium uppercase tracking-tighter">
                Sistema de Segurança Sinal Agro v2.0
            </p>
        </form>
      </div>
    </div>
  );
};

export default AdminAuthModal;
