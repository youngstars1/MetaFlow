import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, X } from 'lucide-react';

/**
 * Smart Confirmation Dialog — not a heavy modal, lightweight + animated
 */
export default function ConfirmDialog({
    isOpen,
    onConfirm,
    onCancel,
    title = '¿Estás seguro?',
    message = 'Esta acción no se puede deshacer.',
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    type = 'danger', // 'danger' | 'warning' | 'info'
}) {
    if (!isOpen) return null;

    const colors = {
        danger: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', icon: '#ef4444' },
        warning: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', icon: '#f59e0b' },
        info: { bg: 'rgba(0,180,216,0.12)', border: 'rgba(0,180,216,0.3)', icon: '#00b4d8' },
    };
    const theme = colors[type] || colors.danger;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                key="confirm-overlay"
                onClick={onCancel}
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1100,
                    padding: 20,
                }}
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirm-title"
                aria-describedby="confirm-desc"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        background: 'var(--bg-secondary)',
                        border: `1px solid ${theme.border}`,
                        borderRadius: 20,
                        padding: '28px 32px',
                        maxWidth: 400,
                        width: '100%',
                        textAlign: 'center',
                    }}
                >
                    {/* Icon */}
                    <div style={{
                        width: 56,
                        height: 56,
                        borderRadius: 16,
                        background: theme.bg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 20px',
                    }}>
                        {type === 'danger' ? <Trash2 size={24} color={theme.icon} /> : <AlertTriangle size={24} color={theme.icon} />}
                    </div>

                    <h3 id="confirm-title" style={{
                        fontFamily: 'Space Grotesk, sans-serif',
                        fontSize: 20,
                        fontWeight: 700,
                        marginBottom: 8,
                    }}>
                        {title}
                    </h3>

                    <p id="confirm-desc" style={{
                        fontSize: 14,
                        color: 'var(--text-muted)',
                        lineHeight: 1.6,
                        marginBottom: 24,
                    }}>
                        {message}
                    </p>

                    <div style={{ display: 'flex', gap: 10 }}>
                        <button
                            onClick={onCancel}
                            style={{
                                flex: 1,
                                padding: '12px',
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 12,
                                color: 'var(--text-primary)',
                                fontSize: 14,
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            style={{
                                flex: 1,
                                padding: '12px',
                                background: type === 'danger'
                                    ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                                    : type === 'warning'
                                        ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                                        : 'var(--accent-gradient)',
                                border: 'none',
                                borderRadius: 12,
                                color: '#fff',
                                fontSize: 14,
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            {confirmText}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
