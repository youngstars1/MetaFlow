import { memo, useMemo, useState, useEffect, useCallback } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { calculateLevel, getLevelTitle, getXPForNextLevel, getLevelIcon } from '../utils/gamification';
import {
    LayoutDashboard,
    Target,
    Wallet,
    CalendarCheck,
    BarChart3,
    Settings,
    Smartphone,
    LogOut,
    LogIn,
    User,
    BookOpen,
    ExternalLink,
    Sun,
    Moon
} from 'lucide-react';

function useInstallPWA() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const install = useCallback(async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') setIsInstalled(true);
        setDeferredPrompt(null);
    }, [deferredPrompt]);

    return { canInstall: !!deferredPrompt && !isInstalled, isInstalled, install };
}

function Sidebar({ isOpen, onClose }) {
    const { state } = useApp();
    const { user, displayName, avatarUrl, logout, configured } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const { totalXP } = state.gamification;
    const { canInstall, isInstalled, install } = useInstallPWA();

    const level = useMemo(() => calculateLevel(totalXP), [totalXP]);
    const levelTitle = useMemo(() => getLevelTitle(level), [level]);
    const levelIcon = useMemo(() => getLevelIcon(level), [level]);
    const xpProgress = useMemo(() => getXPForNextLevel(totalXP), [totalXP]);

    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-header" style={{ padding: '0 16px', marginBottom: 40 }}>
                <Link to="/" className="sidebar-logo" onClick={onClose} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img
                        src="/metaflow.svg"
                        alt="MetaFlow"
                        style={{
                            width: 40, height: 40, borderRadius: 10,
                        }}
                    />
                    <span style={{
                        fontFamily: 'Space Grotesk', fontSize: 22, fontWeight: 700,
                        color: 'var(--text-primary)', letterSpacing: '-0.02em'
                    }}>MetaFlow</span>
                </Link>
            </div>

            {/* XP Level Card */}
            <div style={{ padding: '0 16px', marginBottom: 32 }}>
                <div style={{
                    padding: '14px', borderRadius: 12,
                    background: 'rgba(0, 245, 212, 0.03)',
                    border: '1px solid rgba(0, 245, 212, 0.08)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <span style={{ fontSize: 20 }}>{levelIcon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {levelTitle}
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--accent-primary)' }}>
                                Nivel {level} · {totalXP.toLocaleString()} XP
                            </div>
                        </div>
                    </div>
                    <div className="liquid-progress">
                        <motion.div
                            className="liquid-progress-fill"
                            initial={{ width: 0 }}
                            animate={{ width: `${xpProgress.progress}%` }}
                            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                        />
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6, textAlign: 'right' }}>
                        {xpProgress.current} / {xpProgress.needed} XP
                    </div>
                </div>
            </div>

            <nav className="sidebar-nav" style={{ flex: 1, padding: '0 12px' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 16px 12px' }}>Inteligencia</div>
                <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                    <LayoutDashboard size={18} />
                    <span>Panel de Control</span>
                </NavLink>
                <NavLink to="/goals" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                    <Target size={18} />
                    <span>Gestión de Metas</span>
                </NavLink>
                <NavLink to="/finances" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                    <Wallet size={18} />
                    <span>Registro Financiero</span>
                </NavLink>

                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '24px 16px 12px' }}>Protocolo</div>
                <NavLink to="/routines" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                    <CalendarCheck size={18} />
                    <span>Rutinas y Disciplina</span>
                </NavLink>
                <NavLink to="/statistics" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                    <BarChart3 size={18} />
                    <span>Estadísticas</span>
                </NavLink>

                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '24px 16px 12px' }}>Sistema</div>
                <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                    <Settings size={18} />
                    <span>Perfil y Ajustes</span>
                </NavLink>
                <NavLink to="/guide" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                    <BookOpen size={18} />
                    <span>Guía de Uso</span>
                </NavLink>
            </nav>

            <div className="sidebar-footer" style={{ padding: 16, borderTop: '1px solid var(--border-color)' }}>
                {/* Theme Toggle */}
                <button onClick={toggleTheme} className="theme-toggle-btn" style={{ marginBottom: 12 }}>
                    {isDark ? <Sun size={14} /> : <Moon size={14} />}
                    {isDark ? 'Modo Claro' : 'Modo Oscuro'}
                </button>

                {canInstall && (
                    <button onClick={install} className="btn-wealth" style={{ width: '100%', marginBottom: 12, fontSize: 12, justifyContent: 'center' }}>
                        <Smartphone size={14} /> Instalar App
                    </button>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 34, height: 34, borderRadius: '10px', background: 'rgba(128,128,128,0.1)', overflow: 'hidden', border: '1px solid var(--border-color)', flexShrink: 0 }}>
                        {avatarUrl ? <img src={avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}><User size={16} /></div>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user ? displayName : 'Modo Local'}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{user ? 'Nube Activa' : 'Offline'}</div>
                    </div>
                </div>

                {user ? (
                    <button onClick={logout} className="btn-wealth btn-wealth-outline" style={{ width: '100%', fontSize: 11, borderColor: 'rgba(239, 68, 68, 0.3)', color: 'var(--danger)', justifyContent: 'center' }}>
                        <LogOut size={14} /> Cerrar Sesión
                    </button>
                ) : configured ? (
                    <button onClick={() => { localStorage.removeItem('metaflow_skipped_login'); window.location.reload(); }} className="btn-wealth" style={{ width: '100%', fontSize: 11, justifyContent: 'center' }}>
                        <LogIn size={14} /> Iniciar Sesión
                    </button>
                ) : null}

                {/* Youngstars Branding */}
                <a
                    href="https://portfolio.youngstarsstore.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="creator-badge"
                    style={{ marginTop: 16, textDecoration: 'none' }}
                >
                    <div style={{
                        width: 28, height: 28, borderRadius: 6,
                        background: 'var(--accent-gradient)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: 800, fontSize: 13, flexShrink: 0
                    }}>Y</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>Youngstars</div>
                        <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>Portfolio <ExternalLink size={8} style={{ display: 'inline', verticalAlign: 'middle' }} /></div>
                    </div>
                </a>
            </div>
        </aside>
    );
}

export default memo(Sidebar);
