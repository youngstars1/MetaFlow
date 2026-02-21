import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone, Zap, ShieldCheck } from 'lucide-react';

let deferredPrompt = null;

export function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').then(
                (reg) => console.log('[SW] Registered Node:', reg.scope),
                (err) => console.log('[SW] Node registration failed:', err)
            );
        });
    }
}

export default function InstallPrompt() {
    const [showPrompt, setShowPrompt] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        const dismissed = localStorage.getItem('wealthflow_install_dismissed');
        if (dismissed) {
            const dismissedTime = new Date(dismissed).getTime();
            if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) return;
        }

        const handler = (e) => {
            e.preventDefault();
            deferredPrompt = e;
            setTimeout(() => setShowPrompt(true), 15000);
        };

        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = useCallback(async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') setIsInstalled(true);
        deferredPrompt = null;
        setShowPrompt(false);
    }, []);

    const handleDismiss = useCallback(() => {
        setShowPrompt(false);
        localStorage.setItem('wealthflow_install_dismissed', new Date().toISOString());
    }, []);

    if (isInstalled || !showPrompt) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                style={{
                    position: 'fixed', bottom: 32, left: '50%', x: '-50%',
                    width: 'calc(100% - 32px)', maxWidth: 420,
                    background: 'rgba(10, 10, 11, 0.98)', border: '1px solid rgba(0, 245, 212, 0.2)',
                    borderRadius: 20, padding: 32, zIndex: 950, backdropFilter: 'blur(20px)',
                    boxShadow: '0 20px 80px rgba(0,0,0,0.8), 0 0 40px rgba(0, 245, 212, 0.05)',
                }}
            >
                <button onClick={handleDismiss} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer' }}><X size={18} /></button>

                <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                    <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Zap size={28} style={{ color: '#000' }} />
                    </div>
                    <div>
                        <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 18, color: '#fff' }}>Desplegar Nodo Local</div>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginTop: 4 }}>
                            Instale WealthFlow para acceso instantáneo a su inteligencia patrimonial y autonomía total fuera de línea.
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
                    <button onClick={handleDismiss} className="btn-wealth btn-wealth-outline" style={{ flex: 1, justifyContent: 'center' }}>Aplazar Despliegue</button>
                    <button onClick={handleInstall} className="btn-wealth" style={{ flex: 1, justifyContent: 'center' }}><Download size={16} /> Activar Nodo</button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
