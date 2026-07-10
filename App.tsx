

// PWA Optimization: Manifest, description and high-resolution icons (192px / 512px) configured for PWABuilder compliance.
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import PortfolioGrid from './components/PortfolioGrid';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import SubscriptionBanner from './components/SubscriptionBanner';
import PaymentModal from './components/PaymentModal';
import SubscriberManager from './components/SubscriberManager';
import OrderManager from './components/OrderManager';
import ResellerManager from './components/ResellerManager';
import SupabaseSetupModal from './components/SupabaseSetupModal';
import Modal from './components/Modal';
import SignDesigner from './components/SignDesigner';
import CodeModal from './components/CodeModal';
import AdminAuthModal from './components/AdminAuthModal';
import CatalogViewerModal from './components/CatalogViewerModal';

import { APP_CONFIG, SAFETY_SIGNS } from './constants';
import { Sign, Subscriber, CartItem, Order, SignCategory } from './types';
import { isConfigured as isSupabaseConfigured, saveOrderToCloud, subscribeToOrders, subscribeToSubscribers, updateOrderStatusInCloud, deleteOrderInCloud, saveSubscriberToCloud, updateSubscriberInCloud, deleteSubscriberInCloud } from './supabaseClient';
import { processGoogleDriveLink } from './utils';
import { generateCatalogPDF, getCatalogHTML } from './utils/catalogGenerator';

function App() {
  const [signs, setSigns] = useState<Sign[]>(() => {
    const saved = localStorage.getItem('app_signs_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return SAFETY_SIGNS;
      }
    }
    return SAFETY_SIGNS;
  });

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminLockHidden, setAdminLockHidden] = useState<boolean>(APP_CONFIG.adminLockHidden);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingCatalogDownload, setPendingCatalogDownload] = useState(false);
  
  const [subscribers, setSubscribers] = useState<Subscriber[]>(() => {
    const saved = localStorage.getItem('app_subscribers_list');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [currentSubscriber, setCurrentSubscriber] = useState<Subscriber | null>(null);
  const [selectedSign, setSelectedSign] = useState<Sign | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSubscriberManagerOpen, setIsSubscriberManagerOpen] = useState(false);
  const [isOrderManagerOpen, setIsOrderManagerOpen] = useState(false);
  const [isResellerManagerOpen, setIsResellerManagerOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isDesignerOpen, setIsDesignerOpen] = useState(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [isCatalogViewerOpen, setIsCatalogViewerOpen] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('app_orders_list');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [reseller, setReseller] = useState<string | undefined>(undefined);
  
  const [storeName, setStoreName] = useState(() => localStorage.getItem('app_store_name') || APP_CONFIG.storeName);
  const [heroTitle, setHeroTitle] = useState(() => localStorage.getItem('app_hero_title') || APP_CONFIG.heroTitle);
  const [logoUrl, setLogoUrl] = useState(() => localStorage.getItem('app_custom_logo') || APP_CONFIG.logoUrl);

  // Efeito para gerenciar o botão "Voltar" do navegador/celular quando o modal está aberto
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (selectedSign) {
        setSelectedSign(null);
      }
      if (isCatalogViewerOpen) {
          setIsCatalogViewerOpen(false);
      }
    };

    if (selectedSign || isCatalogViewerOpen) {
      window.history.pushState({ modalOpen: true }, "");
      window.addEventListener('popstate', handlePopState);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [selectedSign, isCatalogViewerOpen]);

  const handleCloseModal = useCallback(() => {
    if (selectedSign) {
      setSelectedSign(null);
      if (window.history.state?.modalOpen) {
        window.history.back();
      }
    }
  }, [selectedSign]);

  const handleCloseCatalogViewer = useCallback(() => {
      setIsCatalogViewerOpen(false);
      if (window.history.state?.modalOpen) {
          window.history.back();
      }
  }, []);

  useEffect(() => {
    localStorage.setItem('app_signs_data', JSON.stringify(signs));
  }, [signs]);

  useEffect(() => {
    localStorage.setItem('app_orders_list', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('app_subscribers_list', JSON.stringify(subscribers));
  }, [subscribers]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const resellerParam = params.get('vendedor') || params.get('reseller');
    if (resellerParam) setReseller(resellerParam);
  }, []);

  useEffect(() => {
    const handleTableMissing = () => {
        setIsSupabaseModalOpen(true);
    };
    window.addEventListener('supabase_table_missing', handleTableMissing);
    return () => window.removeEventListener('supabase_table_missing', handleTableMissing);
  }, []);

  useEffect(() => {
    if (isSupabaseConfigured) {
        const unsubOrders = subscribeToOrders(setOrders);
        const unsubSubs = subscribeToSubscribers(setSubscribers);
        return () => { unsubOrders(); unsubSubs(); };
    }
  }, []);

  const handleLogoUpdate = (url: string) => {
    const processedUrl = processGoogleDriveLink(url);
    setLogoUrl(processedUrl);
    localStorage.setItem('app_custom_logo', processedUrl);
  };

  const handleStoreNameChange = (name: string) => {
      setStoreName(name);
      localStorage.setItem('app_store_name', name);
  };

  const handleHeroTitleChange = (title: string) => {
      setHeroTitle(title);
      localStorage.setItem('app_hero_title', title);
  };

  const handleUpdateSign = (id: number, data: Partial<Sign>) => {
    setSigns(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
    if (selectedSign && selectedSign.id === id) {
      setSelectedSign(prev => prev ? { ...prev, ...data } : null);
    }
  };

  const handleDeleteSign = useCallback((id: number) => {
    setSigns(prev => {
        const filtered = prev.filter(s => s.id !== id);
        return filtered;
    });
  }, []);

  const handleExportData = () => {
    const data = {
        config: { storeName, heroTitle, logoUrl, adminLockHidden },
        signs: signs
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup-catalogo-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target?.result as string);
            if (data.signs) setSigns(data.signs);
            if (data.config) {
                if (data.config.storeName) handleStoreNameChange(data.config.storeName);
                if (data.config.heroTitle) handleHeroTitleChange(data.config.heroTitle);
                if (data.config.logoUrl) handleLogoUpdate(data.config.logoUrl);
            }
            alert("✅ Dados importados com sucesso!");
        } catch (err) {
            alert("❌ Erro ao ler arquivo de backup.");
        }
    };
    reader.readAsText(file);
  };

  const handleGenerateCode = () => {
      const config = {
          ...APP_CONFIG,
          storeName,
          heroTitle,
          logoUrl,
          adminLockHidden,
          buildId: Date.now().toString()
      };
      const code = `export const APP_CONFIG = ${JSON.stringify(config, null, 2)};\n\nexport const SAFETY_SIGNS = ${JSON.stringify(signs, null, 2)};`;
      setGeneratedCode(code.trim());
      setIsCodeModalOpen(true);
  };

  const handleToggleAdmin = () => {
      if (!isAdminMode) {
          setPendingCatalogDownload(false);
          setIsAuthModalOpen(true);
      } else {
          setIsAdminMode(false);
      }
  };

  const executeDownload = useCallback(() => {
    generateCatalogPDF(signs, {
        storeName: storeName,
        logoUrl: logoUrl,
        whatsappNumber: APP_CONFIG.whatsappNumber
    });
  }, [signs, storeName, logoUrl]);

  const handleAdminAuth = (password: string) => {
      if (password === "ADMIN123") {
          setIsAdminMode(true);
          setIsAuthModalOpen(false);
          if (pendingCatalogDownload) {
              executeDownload();
              setPendingCatalogDownload(false);
          }
      } else {
          alert("❌ Senha incorreta!");
      }
  };

  const handleCreateFreeAccount = (name: string, city: string, resellerName?: string) => {
     const expiryDate = new Date();
     expiryDate.setFullYear(expiryDate.getFullYear() + 10);
     const newSub: Subscriber = {
         id: Math.random().toString(36).substr(2, 9),
         name: `${name} (${city})`,
         accessKey: 'ACESSO-' + Math.random().toString(36).substr(2, 4).toUpperCase(),
         isActive: true,
         createdAt: new Date().toISOString(),
         type: 'vip',
         credits: 999, 
         validUntil: expiryDate.toISOString().split('T')[0],
         reseller: resellerName 
     };
     if (isSupabaseConfigured) saveSubscriberToCloud(newSub);
     setSubscribers(prev => [...prev, newSub]);
     setCurrentSubscriber(newSub);
     return newSub;
  };

  const addToCart = (item: CartItem) => setCartItems(prev => [...prev, item]);
  const removeFromCart = (id: string) => setCartItems(prev => prev.filter(i => i.id !== id));
  
  const handlePrintSign = (sign: Sign, size: string) => {
      const imageUrl = processGoogleDriveLink(sign.imageUrl);
      window.open(imageUrl, '_blank');
  };

  const handleProtectedDownload = () => {
    if (isAdminMode) {
        executeDownload();
    } else {
        setPendingCatalogDownload(true);
        setIsAuthModalOpen(true);
    }
  };

  // Gera o HTML do catálogo apenas quando o modal de visualização é aberto
  const currentCatalogHtml = useMemo(() => {
      if (!isCatalogViewerOpen) return '';
      return getCatalogHTML(signs, {
          storeName: storeName,
          logoUrl: logoUrl,
          whatsappNumber: APP_CONFIG.whatsappNumber
      });
  }, [isCatalogViewerOpen, signs, storeName, logoUrl]);

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Header 
        logoUrl={logoUrl}
        onLogoUpload={handleLogoUpdate} 
        cartItemCount={cartItems.length}
        onOpenCart={() => setIsCartOpen(true)}
        onExportData={handleExportData}
        onImportData={handleImportData}
        isAdminMode={isAdminMode}
        onToggleAdmin={handleToggleAdmin}
        adminLockHidden={adminLockHidden}
        onToggleLockVisibility={() => setAdminLockHidden(prev => !prev)}
        isSubscriber={!!currentSubscriber}
        currentSubscriber={currentSubscriber}
        onSubscriberLogin={(key) => {
            const sub = subscribers.find(s => s.accessKey === key);
            if (sub && sub.isActive) { setCurrentSubscriber(sub); return true; }
            return false;
        }}
        onSubscriberLogout={() => setCurrentSubscriber(null)}
        onOpenSubscriberManager={() => setIsSubscriberManagerOpen(true)}
        onOpenOrderManager={() => setIsOrderManagerOpen(true)}
        lastBackupTime={new Date()}
        onRestoreCheckpoint={() => {}}
        onOpenMaterialManager={() => {}}
        onOpenDesigner={() => setIsDesignerOpen(true)}
        onManualSave={() => {}}
        storageUsage="0%"
        whatsappNumber={APP_CONFIG.whatsappNumber}
        storeName={storeName}
        onStoreNameChange={handleStoreNameChange}
        pdfCatalogUrl={APP_CONFIG.pdfCatalogUrl}
        onPdfUrlChange={() => {}}
        onGenerateCode={handleGenerateCode}
        onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        onOpenResellerManager={() => setIsResellerManagerOpen(true)}
        pendingOrdersCount={orders.filter(o => o.status === 'Pendente').length}
        onDownloadCatalog={handleProtectedDownload}
        onViewCatalog={() => setIsCatalogViewerOpen(true)}
      />
      
      <main className="flex-grow">
          <Hero title={heroTitle} onTitleChange={handleHeroTitleChange} isAdminMode={isAdminMode} />
          <SubscriptionBanner onSubscribeClick={() => setIsPaymentModalOpen(true)} currentSubscriber={currentSubscriber} />
          
          <PortfolioGrid 
            signs={signs} 
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onSignClick={(s) => setSelectedSign(s)}
            onSignContentChange={(id, field, val) => setSigns(prev => prev.map(s => s.id === id ? {...s, [field]: val} : s))}
            onImageUpload={(id, file) => {
                const reader = new FileReader();
                reader.onload = (e) => setSigns(prev => prev.map(s => s.id === id ? {...s, imageUrl: e.target?.result as string} : s));
                reader.readAsDataURL(file);
            }}
            onAddNewSign={(cat) => {
                const newSign = { id: Date.now(), title: 'NOVA PLACA', description: 'Sinalização técnica', category: cat, imageUrl: 'https://via.placeholder.com/500x330/DC2626/FFFFFF?text=NOVA+ARTE', isHidden: false };
                setSigns(prev => [newSign, ...prev]);
            }}
            onNewSignUrlClick={(cat, url) => {
                if(!url) return;
                const processedUrl = processGoogleDriveLink(url);
                const newSign = { id: Date.now(), title: 'NOVA PLACA', description: 'Sinalização técnica', category: cat, imageUrl: processedUrl, isHidden: false };
                setSigns(prev => [newSign, ...prev]);
            }}
            onSortSigns={() => {}}
            onDeleteSign={handleDeleteSign}
            isAdminMode={isAdminMode}
            isSubscriber={!!currentSubscriber}
            onToggleVisibility={(id) => setSigns(prev => prev.map(s => s.id === id ? {...s, isHidden: !s.isHidden} : s))}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            pdfCatalogUrl={APP_CONFIG.pdfCatalogUrl}
          />
      </main>
      
      <footer className="mt-auto">
        <Footer storeName={storeName} resellerName={reseller} />
      </footer>
      
      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        cartItems={cartItems} 
        onRemoveItem={removeFromCart} 
        onUpdateQuantity={(id, d) => setCartItems(prev => prev.map(i => i.id === id ? {...i, quantity: Math.max(1, i.quantity + d)} : i))} 
        onPlaceOrder={(order) => { if (isSupabaseConfigured) saveOrderToCloud(order); setOrders(prev => [order, ...prev]); setCartItems([]); }} 
        whatsappNumber={APP_CONFIG.whatsappNumber} 
        storeName={storeName} 
        logoUrl={logoUrl}
      />
      
      {selectedSign && (
          <Modal 
            isOpen={!!selectedSign} 
            onClose={handleCloseModal} 
            sign={selectedSign} 
            isAdminMode={isAdminMode} 
            isSubscriber={!!currentSubscriber} 
            currentSubscriber={currentSubscriber} 
            onAddToCart={addToCart} 
            onPrint={handlePrintSign}
            onUpdateSign={handleUpdateSign}
          />
      )}
      
      {isDesignerOpen && (
          <div className="fixed inset-0 z-[100] bg-white">
              <SignDesigner 
                onCancel={() => setIsDesignerOpen(false)}
                onSave={(img) => {
                    const newSign = { 
                        id: Date.now(), 
                        title: 'Placa Customizada', 
                        description: 'Criada no Designer', 
                        category: SignCategory.Custom, 
                        imageUrl: img, 
                        isHidden: false 
                    };
                    setSigns(prev => [newSign, ...prev]);
                    setIsDesignerOpen(false);
                }}
              />
          </div>
      )}

      <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} isAdminMode={isAdminMode} reseller={reseller} onGenerateFreeAccess={(n, c, r) => handleCreateFreeAccount(n, c, r)} />
      <OrderManager isOpen={isOrderManagerOpen} onClose={() => setIsOrderManagerOpen(false)} orders={orders} onUpdateStatus={(id, s) => { if (isSupabaseConfigured) updateOrderStatusInCloud(id, s); setOrders(prev => prev.map(o => o.id === id ? { ...o, status: s } : o)); }} onDeleteOrder={(id) => { if (isSupabaseConfigured) deleteOrderInCloud(id); setOrders(prev => prev.filter(o => o.id !== id)); }} isOnline={isSupabaseConfigured} />
      <SubscriberManager isOpen={isSubscriberManagerOpen} onClose={() => setIsSubscriberManagerOpen(false)} subscribers={subscribers} onAddSubscriber={(n, t, v, r, p, c) => { const newSub = { id: Math.random().toString(), name: n, type: t, validUntil: v, reseller: r, planType: p, commission: c, accessKey: Math.random().toString(36).substr(2, 6).toUpperCase(), isActive: true, createdAt: new Date().toISOString(), credits: t === 'trial' ? 5 : 0 }; if (isSupabaseConfigured) saveSubscriberToCloud(newSub); setSubscribers(prev => [...prev, newSub]); }} onToggleStatus={(id) => { const sub = subscribers.find(s => s.id === id); if (sub && isSupabaseConfigured) updateSubscriberInCloud(id, { isActive: !sub.isActive }); setSubscribers(prev => prev.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s)); }} onDeleteSubscriber={(id) => { if (isSupabaseConfigured) deleteSubscriberInCloud(id); setSubscribers(prev => prev.filter(s => s.id !== id)); }} onUpdateSubscriber={(id, d) => { if (isSupabaseConfigured) updateSubscriberInCloud(id, d); setSubscribers(prev => prev.map(s => s.id === id ? { ...s, ...d } : s)); }} isOnline={isSupabaseConfigured} />
      <ResellerManager isOpen={isResellerManagerOpen} onClose={() => setIsResellerManagerOpen(false)} />
      <SupabaseSetupModal isOpen={isSupabaseModalOpen} onClose={() => setIsSupabaseModalOpen(false)} />
      <CodeModal isOpen={isCodeModalOpen} onClose={() => setIsCodeModalOpen(false)} code={generatedCode} />
      <AdminAuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onConfirm={handleAdminAuth} />
      <CatalogViewerModal isOpen={isCatalogViewerOpen} onClose={handleCloseCatalogViewer} htmlContent={currentCatalogHtml} />
    </div>
  );
}

export default App;
