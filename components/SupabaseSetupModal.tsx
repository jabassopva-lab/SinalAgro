
// Add React import to the file
import React, { useState } from 'react';
import { checkTablesConnection } from '../supabaseClient';

const SQL_FIX_CODE = `-- SCRIPT DE CONFIGURAÇÃO SINAL AGRO
-- Execute este código no SQL Editor do Supabase

-- 1. Tabelas Principais
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  short_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  customer_name TEXT,
  customer_phone TEXT,
  items JSONB,
  total NUMERIC,
  status TEXT,
  reseller TEXT,
  observations TEXT
);

CREATE TABLE IF NOT EXISTS public.subscribers (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  name TEXT,
  access_key TEXT,
  is_active BOOLEAN DEFAULT true,
  type TEXT,
  credits NUMERIC DEFAULT 0,
  valid_until TEXT,
  reseller TEXT
);

CREATE TABLE IF NOT EXISTS public.resellers (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  name TEXT,
  phone TEXT,
  doc TEXT,
  city TEXT,
  pix_key TEXT
);

-- 2. Habilitar Realtime com segurança (Idempotente)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.subscribers;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.resellers;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Políticas de Acesso Público (RLS)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Access Orders" ON public.orders;
CREATE POLICY "Public Access Orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Access Subscribers" ON public.subscribers;
CREATE POLICY "Public Access Subscribers" ON public.subscribers FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.resellers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Access Resellers" ON public.resellers;
CREATE POLICY "Public Access Resellers" ON public.resellers FOR ALL USING (true) WITH CHECK (true);`;

interface SupabaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Fixed missing React namespace by adding React import
const SupabaseSetupModal: React.FC<SupabaseSetupModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [status, setStatus] = useState<{success?: boolean, message?: string}>({});

  if (!isOpen) return null;

  const handleCopy = () => {
      navigator.clipboard.writeText(SQL_FIX_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = async () => {
      setVerifying(true);
      const res = await checkTablesConnection();
      setStatus(res);
      setVerifying(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        
        <div className="bg-red-600 p-6 flex justify-between items-center text-white shrink-0">
          <div>
            <h2 className="font-bold text-xl flex items-center gap-2">⚡ CONFIGURAR BANCO DE DADOS</h2>
            <p className="text-red-100 text-xs mt-1">Siga os passos para ativar a sincronização online.</p>
          </div>
          <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full transition-colors">✕</button>
        </div>
        
        <div className="p-6 overflow-y-auto custom-scrollbar bg-slate-50 flex-1">
          <div className="space-y-6">
            
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 text-sm mb-3">1. Execute o Script SQL</h3>
                <p className="text-xs text-slate-600 mb-4">Acesse o <strong>SQL Editor</strong> no painel do Supabase e execute este código:</p>
                
                <div className="bg-slate-900 rounded-lg p-4 relative group">
                    <button onClick={handleCopy} className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-3 py-1.5 rounded hover:bg-red-700 transition-colors">
                        {copied ? 'Copiado!' : 'COPIAR SQL'}
                    </button>
                    <pre className="text-[10px] font-mono text-green-400 overflow-x-auto whitespace-pre max-h-40 custom-scrollbar">
                        {SQL_FIX_CODE}
                    </pre>
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 text-sm mb-3">2. Validar Conexão</h3>
                <p className="text-xs text-slate-600 mb-4">Após clicar em "RUN" no Supabase, verifique aqui se as tabelas foram criadas:</p>
                
                <div className="flex flex-col gap-3">
                    <button 
                        onClick={handleVerify}
                        disabled={verifying}
                        className={`w-full py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${verifying ? 'bg-slate-100 text-slate-400' : 'bg-slate-800 text-white hover:bg-slate-900 shadow-lg'}`}
                    >
                        {verifying ? 'Verificando...' : 'Verificar Tabelas'}
                    </button>

                    {status.message && (
                        <div className={`p-3 rounded-lg border text-xs font-bold animate-fade-in ${status.success ? 'bg-green-50 border-green-200 text-green-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                            {status.success ? '✅ ' : '❌ '} {status.message}
                        </div>
                    )}

                    {status.success && (
                        <button 
                            onClick={() => window.location.reload()}
                            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-black text-sm animate-bounce shadow-xl mt-2"
                        >
                            RECARREGAR APP AGORA 🚀
                        </button>
                    )}
                </div>
            </div>

          </div>
        </div>
        
        <div className="p-4 bg-slate-100 border-t border-slate-200 text-center">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Sinal Agro • Gerenciamento Industrial</p>
        </div>
      </div>
    </div>
  );
};

export default SupabaseSetupModal;
