import { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Mail, X, CheckCircle, RefreshCw, ArrowRight, ShieldCheck } from 'lucide-react';

/**
 * EmailVerificationBanner
 * Shows a professional banner when a user has signed up with email but hasn't verified yet.
 * Similar to Stripe, Notion, Linear — premium apps that gently push verification.
 */
function EmailVerificationBanner() {
    const { user } = useAuth();
    const [dismissed, setDismissed] = useState(false);
    const [resending, setResending] = useState(false);
    const [resent, setResent] = useState(false);

    // Check if user exists, is logged in via email (not OAuth), and email is not confirmed
    const needsVerification = user
        && user.app_metadata?.provider === 'email'
        && !user.email_confirmed_at
        && !dismissed;

    const handleResendEmail = useCallback(async () => {
        if (resending || resent) return;
        setResending(true);
        try {
            const { supabase } = await import('../lib/supabase');
            await supabase.auth.resend({
                type: 'signup',
                email: user.email,
            });
            setResent(true);
            setTimeout(() => setResent(false), 30000); // Reset after 30s
        } catch {
            // Silently fail
        }
        setResending(false);
    }, [user, resending, resent]);

    if (!needsVerification) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -20, height: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                style={{
                    background: 'linear-gradient(135deg, rgba(0, 184, 156, 0.08), rgba(61, 168, 214, 0.08))',
                    border: '1px solid rgba(0, 184, 156, 0.15)',
                    borderRadius: 14,
                    padding: '16px 20px',
                    marginBottom: 24,
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Decorative gradient line at top */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: 'var(--accent-gradient)',
                }} />

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    flexWrap: 'wrap',
                }}>
                    {/* Icon */}
                    <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: 'var(--accent-gradient)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}>
                        <Mail size={18} color="#fff" />
                    </div>

                    {/* Text */}
                    <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            marginBottom: 3,
                            fontFamily: 'Space Grotesk',
                        }}>
                            Verifica tu correo electrónico
                        </div>
                        <div style={{
                            fontSize: 12,
                            color: 'var(--text-secondary)',
                            lineHeight: 1.5,
                        }}>
                            Enviamos un enlace de verificación a <strong style={{ color: 'var(--accent-primary)' }}>{user.email}</strong>.
                            Revisa tu bandeja de entrada (y spam) para activar tu cuenta.
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                            onClick={handleResendEmail}
                            disabled={resending || resent}
                            style={{
                                background: resent ? 'rgba(0, 184, 156, 0.1)' : 'var(--accent-gradient)',
                                border: 'none',
                                borderRadius: 8,
                                padding: '8px 14px',
                                color: resent ? 'var(--accent-primary)' : '#fff',
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: resending || resent ? 'default' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                transition: 'all 0.3s ease',
                                opacity: resending ? 0.6 : 1,
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {resent ? (
                                <>
                                    <CheckCircle size={13} />
                                    Enviado
                                </>
                            ) : resending ? (
                                <>
                                    <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} />
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <RefreshCw size={13} />
                                    Reenviar
                                </>
                            )}
                        </button>

                        <button
                            onClick={() => setDismissed(true)}
                            style={{
                                background: 'none',
                                border: 'none',
                                padding: 6,
                                cursor: 'pointer',
                                color: 'var(--text-muted)',
                                borderRadius: 6,
                                display: 'flex',
                                transition: 'all 0.2s',
                            }}
                            aria-label="Cerrar"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

/**
 * EmailVerificationModal
 * A full-screen modal shown IMMEDIATELY after user registration.
 * Professional look similar to Stripe, Vercel, Linear signup flows.
 */
export function EmailVerificationModal({ email, onClose }) {
    const [countdown, setCountdown] = useState(60);

    useEffect(() => {
        if (countdown <= 0) return;
        const timer = setInterval(() => setCountdown(c => c - 1), 1000);
        return () => clearInterval(timer);
    }, [countdown]);

    const handleResend = async () => {
        try {
            const { supabase } = await import('../lib/supabase');
            await supabase.auth.resend({ type: 'signup', email });
            setCountdown(60);
        } catch { /* silent */ }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
                position: 'fixed',
                inset: 0,
                background: 'var(--bg-modal)',
                backdropFilter: 'blur(12px)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 20,
            }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                style={{
                    maxWidth: 460,
                    width: '100%',
                    textAlign: 'center',
                }}
            >
                {/* Animated mail icon */}
                <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                        width: 88,
                        height: 88,
                        borderRadius: 22,
                        background: 'var(--accent-gradient)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 32,
                        boxShadow: '0 0 40px rgba(0, 184, 156, 0.25)',
                    }}
                >
                    <Mail size={38} color="#fff" strokeWidth={1.5} />
                </motion.div>

                <h1
                    className="font-title"
                    style={{
                        fontSize: 28,
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        marginBottom: 12,
                        letterSpacing: '-0.02em',
                    }}
                >
                    Verifica tu correo
                </h1>

                <p style={{
                    fontSize: 14,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.7,
                    marginBottom: 8,
                    maxWidth: 360,
                    margin: '0 auto 24px',
                }}>
                    Te hemos enviado un enlace de verificación a:
                </p>

                <div style={{
                    padding: '12px 20px',
                    background: 'rgba(0, 184, 156, 0.06)',
                    border: '1px solid rgba(0, 184, 156, 0.15)',
                    borderRadius: 10,
                    display: 'inline-block',
                    marginBottom: 28,
                }}>
                    <span style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: 'var(--accent-primary)',
                        fontFamily: 'Space Grotesk',
                    }}>
                        {email}
                    </span>
                </div>

                <div style={{
                    padding: '20px 24px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 14,
                    marginBottom: 24,
                    textAlign: 'left',
                }}>
                    <div style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        marginBottom: 14,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                    }}>
                        Pasos siguientes
                    </div>
                    {[
                        { num: 1, text: 'Abre tu correo electrónico' },
                        { num: 2, text: 'Busca "Confirmar tu correo"' },
                        { num: 3, text: 'Haz clic en el enlace de verificación' },
                        { num: 4, text: '¡Listo! Tu cuenta estará activa' },
                    ].map(step => (
                        <div key={step.num} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            marginBottom: step.num < 4 ? 12 : 0,
                        }}>
                            <div style={{
                                width: 26,
                                height: 26,
                                borderRadius: '50%',
                                background: 'var(--accent-gradient)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                fontSize: 12,
                                fontWeight: 700,
                                flexShrink: 0,
                            }}>
                                {step.num}
                            </div>
                            <span style={{
                                fontSize: 13,
                                color: 'var(--text-secondary)',
                            }}>
                                {step.text}
                            </span>
                        </div>
                    ))}
                </div>

                <div style={{
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    marginBottom: 20,
                }}>
                    {countdown > 0 ? (
                        <>¿No recibiste el correo? Podrás reenviar en <strong style={{ color: 'var(--accent-primary)' }}>{countdown}s</strong></>
                    ) : (
                        <button
                            onClick={handleResend}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--accent-primary)',
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                padding: 0,
                            }}
                        >
                            Reenviar correo de verificación
                        </button>
                    )}
                </div>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                    <button
                        onClick={onClose}
                        className="btn-wealth"
                        style={{
                            justifyContent: 'center',
                            padding: '12px 28px',
                        }}
                    >
                        <ShieldCheck size={16} />
                        Ya verifiqué mi correo
                    </button>
                </div>

                <div style={{
                    marginTop: 20,
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    lineHeight: 1.6,
                }}>
                    Si no encuentras el correo, revisa tu carpeta de spam.
                    <br />
                    También puedes verificar más tarde.
                </div>
            </motion.div>
        </motion.div>
    );
}

export default memo(EmailVerificationBanner);
