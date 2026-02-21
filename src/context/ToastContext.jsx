import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle, AlertTriangle, Info, XCircle, Zap, X } from 'lucide-react';

const ToastContext = createContext();

let toastIdCounter = 0;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const timersRef = useRef({});

    const removeToast = useCallback((id) => {
        if (timersRef.current[id]) {
            clearTimeout(timersRef.current[id]);
            delete timersRef.current[id];
        }
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const addToast = useCallback((message, options = {}) => {
        const id = ++toastIdCounter;
        const {
            type = 'info',       // 'success' | 'error' | 'warning' | 'info' | 'xp'
            duration = 4000,
            undoAction = null,   // callback for undo
            xpAmount = 0,
            persistent = false,
        } = options;

        const toast = { id, message, type, undoAction, xpAmount };
        setToasts(prev => [...prev, toast]);

        if (!persistent) {
            timersRef.current[id] = setTimeout(() => {
                removeToast(id);
            }, duration);
        }

        return id;
    }, [removeToast]);

    const handleUndo = useCallback((toast) => {
        if (toast.undoAction) {
            toast.undoAction();
        }
        removeToast(toast.id);
    }, [removeToast]);

    const renderIcon = (type) => {
        const size = 18;
        switch (type) {
            case 'success': return <CheckCircle size={size} color="var(--accent-primary)" />;
            case 'error': return <XCircle size={size} color="var(--danger)" />;
            case 'warning': return <AlertTriangle size={size} color="var(--accent-warm)" />;
            case 'xp': return <Zap size={size} color="var(--accent-primary)" />;
            default: return <Info size={size} color="#70d6ff" />;
        }
    };

    return (
        <ToastContext.Provider value={{ addToast, removeToast }}>
            {children}
            <div
                style={{
                    position: 'fixed', bottom: 24, right: 24,
                    display: 'flex', flexDirection: 'column', gap: 8,
                    zIndex: 9999, maxWidth: 400, pointerEvents: 'none',
                }}
            >
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        style={{
                            pointerEvents: 'all', display: 'flex', alignItems: 'center', gap: 12,
                            padding: '12px 20px', background: 'rgba(10, 10, 11, 0.95)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            borderRadius: 12, backdropFilter: 'blur(20px)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                            animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                            color: '#fff', fontSize: 13, fontWeight: 500, minWidth: 300,
                        }}
                    >
                        <span style={{ display: 'flex', flexShrink: 0 }}>{renderIcon(toast.type)}</span>
                        <span style={{ flex: 1, letterSpacing: '0.01em' }}>
                            {toast.message}
                            {toast.xpAmount > 0 && (
                                <span style={{ marginLeft: 8, fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--accent-primary)' }}>
                                    +{toast.xpAmount} XP
                                </span>
                            )}
                        </span>
                        {toast.undoAction && (
                            <button
                                onClick={() => handleUndo(toast)}
                                style={{
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: 6, color: 'var(--accent-primary)',
                                    padding: '4px 10px', fontSize: 11, fontWeight: 700,
                                    cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em'
                                }}
                            >
                                Deshacer Protocolo
                            </button>
                        )}
                        <button
                            onClick={() => removeToast(toast.id)}
                            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', display: 'flex' }}
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within ToastProvider');
    return context;
}
