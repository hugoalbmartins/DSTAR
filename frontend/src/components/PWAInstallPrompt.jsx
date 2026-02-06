import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone } from 'lucide-react';
import { ModernButton } from '@/components/modern';

export function useIsPWA() {
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const check = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches
        || window.navigator.standalone === true
        || document.referrer.includes('android-app://');
      setIsStandalone(standalone);
    };
    check();

    const mql = window.matchMedia('(display-mode: standalone)');
    const handler = () => check();
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return isStandalone;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showRedirectBanner, setShowRedirectBanner] = useState(false);
  const isStandalone = useIsPWA();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const dismissedAt = localStorage.getItem('pwa_install_dismissed');
    if (dismissedAt) {
      const daysSince = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) {
        setDismissed(true);
      } else {
        localStorage.removeItem('pwa_install_dismissed');
      }
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!dismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setShowBanner(false);
      setDeferredPrompt(null);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [dismissed]);

  useEffect(() => {
    if (!isStandalone && !deferredPrompt && !dismissed) {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      if (isMobile) {
        const installed = localStorage.getItem('pwa_was_installed');
        if (installed) {
          setShowRedirectBanner(true);
        } else if (isIOS) {
          if (!dismissed) {
            setShowBanner(true);
          }
        }
      }
    }
  }, [isStandalone, deferredPrompt, dismissed]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        localStorage.setItem('pwa_was_installed', 'true');
      }
      setDeferredPrompt(null);
      setShowBanner(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowRedirectBanner(false);
    setDismissed(true);
    localStorage.setItem('pwa_install_dismissed', Date.now().toString());
  };

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  if (isStandalone) return null;

  return (
    <AnimatePresence>
      {(showBanner || showRedirectBanner) && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-[60] p-4 safe-area-bottom"
        >
          <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-2xl border border-slate-200 p-5">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 flex-shrink-0">
                <Smartphone size={24} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                {showRedirectBanner ? (
                  <>
                    <h3 className="font-bold text-slate-900 text-base">App ja instalada</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      Abra o CRM Dolphin+Star a partir do icone no ecra principal para uma melhor experiencia.
                    </p>
                  </>
                ) : isIOS ? (
                  <>
                    <h3 className="font-bold text-slate-900 text-base">Instalar CRM Dolphin+Star</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      Toque em <span className="inline-flex items-center mx-1 px-1.5 py-0.5 bg-slate-100 rounded text-xs font-medium">Partilhar</span> e depois em <span className="inline-flex items-center mx-1 px-1.5 py-0.5 bg-slate-100 rounded text-xs font-medium">Adicionar ao ecra principal</span>
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="font-bold text-slate-900 text-base">Instalar CRM Dolphin+Star</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      Instale a app para acesso rapido e notificacoes.
                    </p>
                    <div className="mt-3">
                      <ModernButton
                        variant="primary"
                        size="sm"
                        icon={Download}
                        onClick={handleInstall}
                      >
                        Instalar
                      </ModernButton>
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={handleDismiss}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
