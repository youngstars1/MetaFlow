import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { usePrivacy } from '../context/PrivacyContext';
import { useAuth } from '../context/AuthContext';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatCurrency, getProgressPercentage } from '../utils/helpers';
import { calculateLevel, getLevelTitle, getXPForNextLevel, evaluateBadges, BADGES } from '../utils/gamification';
import {
    Save, User, Mail, Trash2, Shield, Eye, EyeOff, LogOut, LogIn, Cloud, CloudOff,
    Target, LayoutDashboard, Calendar, Trophy, Zap, Wallet, Activity, Repeat
} from 'lucide-react';

export default function Profile() {
    const { state, dispatch } = useApp();
    const { addToast } = useToast();
    const { isPrivate, togglePrivacy } = usePrivacy();
    const { user, displayName, avatarUrl, logout, configured } = useAuth();
    const { goals, transactions, routines, profile, gamification } = state;

    const [name, setName] = useState(profile.name || '');
    const [email, setEmail] = useState(profile.email || '');
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    const level = calculateLevel(gamification.totalXP);
    const badges = evaluateBadges(state);
    const earnedBadges = badges.filter(b => b.earned);
    const xpProgress = getXPForNextLevel(gamification.totalXP);

    const handleSave = useCallback(() => {
        dispatch({
            type: 'UPDATE_PROFILE',
            payload: { ...profile, name, email },
        });
        addToast('Perfil actualizado correctamente', { type: 'success' });
    }, [name, email, profile, dispatch, addToast]);

    const handleReset = useCallback(() => {
        localStorage.clear();
        addToast('Todos los datos han sido eliminados de este dispositivo', { type: 'warning' });
        setTimeout(() => window.location.reload(), 1000);
        setShowResetConfirm(false);
    }, [addToast]);

    return (
        <motion.div
            className="page-content fade-and-slide"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
            <div className="page-header" style={{ marginBottom: 40 }}>
                <h1 className="page-title" style={{ fontSize: 32 }}>Perfil y Ajustes</h1>
                <p className="page-subtitle">Gestiona tu identidad, revisa tus logros y configura la privacidad</p>
            </div>

            <div className="bento-grid">
                {/* LEFT COLUMN - IDENTITY */}
                <div className="bento-span-4" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* User Card */}
                    <div className="card-wealth">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                            <div className="profile-avatar-large" style={{
                                width: 64, height: 64,
                                background: 'var(--accent-gradient)',
                                borderRadius: '50%', padding: 2,
                                overflow: 'hidden'
                            }}>
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{
                                        width: '100%', height: '100%', background: 'var(--bg-card)',
                                        borderRadius: '50%', display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', fontSize: 24, fontWeight: 700
                                    }}>
                                        {name ? name.charAt(0).toUpperCase() : <User size={24} />}
                                    </div>
                                )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 18, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user ? displayName : (name || 'Usuario')}</div>
                                <div style={{ fontSize: 13, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user ? user.email : (email || 'Perfil Local')}</div>
                            </div>
                        </div>

                        <div style={{
                            padding: '12px 16px', borderRadius: 8,
                            background: user ? 'rgba(0, 245, 212, 0.05)' : 'rgba(255, 190, 11, 0.05)',
                            border: '1px solid var(--border-color)',
                            display: 'flex', alignItems: 'center', gap: 10,
                            fontSize: 12, fontWeight: 500,
                            color: user ? 'var(--accent-primary)' : 'var(--accent-warm)',
                            marginBottom: 20
                        }}>
                            {user ? <Cloud size={14} /> : <CloudOff size={14} />}
                            {user ? 'Sincronizado con la Nube' : 'Sin sincronizar (Solo Local)'}
                        </div>

                        <div style={{ marginBottom: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                                <span className="font-title">{getLevelTitle(level)} - Nivel {level}</span>
                                <span>{xpProgress.progress}%</span>
                            </div>
                            <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                                <div style={{
                                    width: `${xpProgress.progress}%`, height: '100%',
                                    background: 'var(--accent-gradient)', borderRadius: 2,
                                    boxShadow: '0 0 10px rgba(0, 245, 212, 0.4)'
                                }} />
                            </div>
                        </div>

                        {user ? (
                            <button onClick={logout} className="btn-wealth btn-wealth-outline" style={{ width: '100%', justifyContent: 'center' }}>
                                <LogOut size={16} /> Cerrar Sesión
                            </button>
                        ) : configured ? (
                            <button onClick={() => { localStorage.removeItem('metaflow_skipped_login'); window.location.reload(); }} className="btn-wealth" style={{ width: '100%', justifyContent: 'center' }}>
                                <LogIn size={16} /> Iniciar Sesión / Registrarse
                            </button>
                        ) : null}
                    </div>

                    {/* Preferences Form */}
                    <div className="card-wealth">
                        <h3 className="section-title" style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20, color: 'var(--text-muted)' }}>Identidad</h3>
                        <div className="form-group">
                            <label className="form-label" style={{ fontSize: 11 }}>Nombre para mostrar</label>
                            <input className="wealth-input" value={name} onChange={e => setName(e.target.value)} placeholder="¿Cómo te llamas?" />
                        </div>
                        <div className="form-group">
                            <label className="form-label" style={{ fontSize: 11 }}>Correo electrónico</label>
                            <input type="email" className="wealth-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" />
                        </div>
                        <button className="btn-wealth" onClick={handleSave} style={{ width: '100%', justifyContent: 'center' }}>
                            <Save size={16} /> Guardar Cambios
                        </button>
                    </div>
                </div>

                {/* MIDDLE COLUMN - STATS & PRIVACY */}
                <div className="bento-span-4" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div className="card-wealth">
                        <h3 className="section-title" style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20, color: 'var(--text-muted)' }}>Resumen de Actividad</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            {[
                                { label: 'Metas', value: goals.length, icon: <Target size={18} /> },
                                { label: 'Movimientos', value: transactions.length, icon: <Activity size={18} /> },
                                { label: 'Hábitos', value: routines.length, icon: <Repeat size={18} /> },
                                { label: 'Logros', value: earnedBadges.length, icon: <Trophy size={18} /> },
                            ].map(s => (
                                <div key={s.label} style={{
                                    padding: '20px', borderRadius: 12,
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.03)',
                                    display: 'flex', flexDirection: 'column', gap: 8
                                }}>
                                    <div style={{ color: 'var(--accent-primary)' }}>{s.icon}</div>
                                    <div style={{ fontSize: 24, fontWeight: 600 }}>{s.value}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card-wealth">
                        <h3 className="section-title" style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20, color: 'var(--text-muted)' }}>Privacidad</h3>
                        <div className="flex-between" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: 12 }}>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {isPrivate ? <EyeOff size={16} /> : <Eye size={16} />}
                                    Modo Incógnito
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                                    {isPrivate ? 'Montos y ahorros ocultos' : 'Todos los montos son visibles'}
                                </div>
                            </div>
                            <button
                                onClick={togglePrivacy}
                                style={{
                                    width: 48, height: 24, borderRadius: 12,
                                    background: isPrivate ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)',
                                    border: 'none', cursor: 'pointer', position: 'relative'
                                }}
                            >
                                <motion.div
                                    animate={{ x: isPrivate ? 26 : 2 }}
                                    style={{ width: 20, height: 20, borderRadius: '50%', background: isPrivate ? '#000' : '#fff', position: 'absolute', top: 2 }}
                                />
                            </button>
                        </div>
                    </div>

                    <div className="card-wealth" style={{ borderColor: 'rgba(255, 93, 93, 0.2)' }}>
                        <h3 className="section-title" style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16, color: 'var(--danger)' }}>Zona de Peligro</h3>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.6 }}>
                            Estas acciones borrarán todos tus datos locales de forma permanente.
                        </p>
                        <button className="btn-wealth btn-wealth-outline" onClick={() => setShowResetConfirm(true)} style={{ width: '100%', borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                            <Trash2 size={16} /> Borrar todos mis datos
                        </button>
                    </div>
                </div>

                {/* RIGHT COLUMN - ACHIEVEMENTS */}
                <div className="bento-span-4" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div className="card-wealth">
                        <h3 className="section-title" style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20, color: 'var(--text-muted)' }}>Mis Medallas de Honor</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                            {badges.map(badge => (
                                <motion.div
                                    key={badge.id}
                                    whileHover={{ y: -4 }}
                                    style={{
                                        aspectRatio: '1/1', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: badge.earned ? 'rgba(0, 245, 212, 0.05)' : 'rgba(255,255,255,0.01)',
                                        border: `1px solid ${badge.earned ? 'rgba(0, 245, 212, 0.2)' : 'rgba(255,255,255,0.03)'}`,
                                        opacity: badge.earned ? 1 : 0.3,
                                        position: 'relative'
                                    }}
                                    title={badge.name + ": " + badge.description}
                                >
                                    {badge.earned && <div style={{ position: 'absolute', top: 4, right: 4, width: 4, height: 4, borderRadius: '50%', background: 'var(--accent-primary)' }} />}
                                    <div style={{ fontSize: 24 }}>
                                        <Trophy size={20} strokeWidth={1} color={badge.earned ? 'var(--accent-primary)' : 'var(--text-muted)'} />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <div className="card-wealth shimmer-metal" style={{ textAlign: 'center', padding: '40px 24px' }}>
                        <div style={{
                            width: 56, height: 56, borderRadius: '50%',
                            background: 'var(--accent-gradient)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
                            color: '#000', fontWeight: 800, fontSize: 24
                        }}>
                            M
                        </div>
                        <h2 className="font-title" style={{ fontSize: 20, marginBottom: 8 }}>MetaFlow</h2>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>v2.5 Professional Discipline</p>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                            Diseñado para tu éxito financiero
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                isOpen={showResetConfirm}
                onConfirm={handleReset}
                onCancel={() => setShowResetConfirm(false)}
                title="¿Borrar todos los datos?"
                message="Esta acción eliminará permanentemente todas tus metas, hábitos y movimientos registrados. No se puede deshacer."
                confirmText="Sí, borrar todo"
                cancelText="Cancelar"
                type="danger"
            />
        </motion.div >
    );
}
