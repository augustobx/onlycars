'use client';

import { useEffect, useState } from 'react';
import { Download, X, Share, PlusSquare, Check } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PwaInstallPrompt({
  appType,
  appName,
}: {
  appType: 'admin' | 'seller' | 'client';
  appName?: string;
}) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already running in standalone mode
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    setIsStandalone(Boolean(isStandaloneMode));

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  if (isStandalone || dismissed) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      // Fallback
      alert('Para instalar esta app, abrila en Chrome o Safari y tocá "Agregar a pantalla principal" en el menú de tu navegador.');
    }
  };

  const config = {
    admin: {
      label: 'Instalar App Admin',
      color: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      badge: 'Admin',
      badgeColor: 'bg-emerald-950 text-emerald-300',
    },
    seller: {
      label: 'Instalar App Ventas',
      color: 'bg-orange-600 hover:bg-orange-700 text-white',
      badge: 'Ventas',
      badgeColor: 'bg-orange-950 text-orange-300',
    },
    client: {
      label: 'Instalar Portal Clientes',
      color: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      badge: 'Clientes',
      badgeColor: 'bg-emerald-950 text-emerald-300',
    },
  }[appType];

  return (
    <>
      {/* FLOATING INSTALL BUTTON / BANNER */}
      <div className="fixed bottom-18 left-4 right-4 max-w-md mx-auto z-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="bg-slate-900/95 backdrop-blur-md text-white border border-slate-700/80 rounded-2xl p-3 shadow-2xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <Download className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${config.badgeColor}`}>
                  {config.badge}
                </span>
                <p className="text-xs font-black truncate">{appName || 'OnlyCars'}</p>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Instalá la app en tu celular</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallClick}
              className={`${config.color} px-3 py-1.5 rounded-xl font-black text-xs shadow-md transition-all active:scale-95 flex items-center gap-1`}
            >
              <span>Instalar</span>
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL INSTRUCCIONES IOS SAFARI */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 space-y-4 shadow-2xl text-slate-900 dark:text-white animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b pb-3 border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-black">Cómo instalar en iPhone / iPad</h3>
              <button onClick={() => setShowIOSModal(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              En Safari, podés instalar la app <strong className="text-slate-900 dark:text-white">{config.label}</strong> en tu pantalla de inicio en 2 simples pasos:
            </p>

            <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 rounded-lg shrink-0">
                  <Share className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold">1. Tocá el botón Compartir</p>
                  <p className="text-[11px] text-slate-500">Ubicado en la barra de navegación inferior de Safari.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300 rounded-lg shrink-0">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold">2. Elegí &quot;Agregar a pantalla de inicio&quot;</p>
                  <p className="text-[11px] text-slate-500">Se creará un acceso directo con ícono y modo pantalla completa.</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl font-black text-xs"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
