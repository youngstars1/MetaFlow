import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { XP_REWARDS } from '../utils/gamification';
import { Play, Pause, RotateCcw, Coffee, Zap, ChevronDown, CheckCircle2, Rewind } from 'lucide-react';

const MODES = {
    focus: { label: 'Enfoque Profundo', minutes: 25, color: '#00f5d4' },
    shortBreak: { label: 'Recuperación Cognitiva', minutes: 5, color: '#70d6ff' },
    longBreak: { label: 'Reinicio del Sistema', minutes: 15, color: '#00b4d8' },
};

export default function PomodoroTimer() {
    const { dispatch } = useApp();
    const { addToast } = useToast();
    const { isDark } = useTheme();

    const [mode, setMode] = useState('focus');
    const [timeLeft, setTimeLeft] = useState(MODES.focus.minutes * 60);
    const [isRunning, setIsRunning] = useState(false);
    const [sessions, setSessions] = useState(0);
    const [isMinimized, setIsMinimized] = useState(true);
    const intervalRef = useRef(null);

    const currentMode = MODES[mode];
    const totalSeconds = currentMode.minutes * 60;

    const progress = useMemo(() => {
        return ((totalSeconds - timeLeft) / totalSeconds) * 100;
    }, [timeLeft, totalSeconds]);

    const formatTime = useCallback((seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }, []);

    const playNotification = useCallback(() => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const gain = ctx.createGain();
            const osc = ctx.createOscillator();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.frequency.value = 800; gain.gain.value = 0.1;
            osc.start(); osc.stop(ctx.currentTime + 0.2);
        } catch { /* audio not available */ }
    }, []);

    const completeSession = useCallback(() => {
        setIsRunning(false);
        playNotification();

        if (mode === 'focus') {
            const newSessions = sessions + 1;
            setSessions(newSessions);
            dispatch({ type: 'ADD_XP', payload: XP_REWARDS.ROUTINE_COMPLETE });
            addToast(`Secuencia de Enfoque ${newSessions} sincronizada`, { type: 'xp', xpAmount: XP_REWARDS.ROUTINE_COMPLETE });

            if (newSessions % 4 === 0) {
                dispatch({ type: 'ADD_XP', payload: XP_REWARDS.ALL_ROUTINES_TODAY });
                addToast('Bono de Materialización: 4 ciclos alcanzados', { type: 'xp', xpAmount: XP_REWARDS.ALL_ROUTINES_TODAY });
                setMode('longBreak');
                setTimeLeft(MODES.longBreak.minutes * 60);
            } else {
                setMode('shortBreak');
                setTimeLeft(MODES.shortBreak.minutes * 60);
            }
        } else {
            setMode('focus');
            setTimeLeft(MODES.focus.minutes * 60);
        }
    }, [mode, sessions, dispatch, addToast, playNotification]);

    useEffect(() => {
        if (isRunning && timeLeft > 0) {
            intervalRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(intervalRef.current);
                        completeSession();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(intervalRef.current);
    }, [isRunning, completeSession]);

    const toggleTimer = useCallback(() => setIsRunning(prev => !prev), []);
    const resetTimer = useCallback(() => {
        setIsRunning(false);
        setTimeLeft(MODES[mode].minutes * 60);
    }, [mode]);

    const switchMode = useCallback((newMode) => {
        setIsRunning(false);
        setMode(newMode);
        setTimeLeft(MODES[newMode].minutes * 60);
    }, []);

    // Theme-aware colors
    const fabBg = isDark ? '#0a0a0b' : '#ffffff';
    const fabBorder = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)';
    const fabShadow = isDark ? '0 10px 30px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0,0,0,0.12)';
    const trackColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
    const panelBg = isDark ? 'rgba(20, 20, 21, 0.98)' : 'rgba(255, 255, 255, 0.98)';
    const panelShadow = isDark ? '0 20px 80px rgba(0,0,0,0.6)' : '0 20px 80px rgba(0,0,0,0.15)';
    const tabBg = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)';
    const tabActiveBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
    const dotInactive = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)';

    if (isMinimized) {
        return (
            <motion.button
                onClick={() => setIsMinimized(false)}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                style={{
                    position: 'fixed', bottom: 24, right: 24, width: 64, height: 64,
                    borderRadius: '50%', background: fabBg,
                    border: `1px solid ${fabBorder}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', zIndex: 900, boxShadow: fabShadow,
                }}
            >
                <svg width="64" height="64" style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
                    <circle cx="32" cy="32" r="28" fill="none" stroke={trackColor} strokeWidth="2" />
                    <motion.circle cx="32" cy="32" r="28" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeDasharray={2 * Math.PI * 28} animate={{ strokeDashoffset: 2 * Math.PI * 28 * (1 - progress / 100) }} />
                </svg>
                {isRunning ? <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>{formatTime(timeLeft)}</span> : <Zap size={24} color="var(--accent-primary)" />}
            </motion.button>
        );
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
                style={{
                    position: 'fixed', bottom: 24, right: 24, width: 340,
                    background: panelBg, border: 'var(--glass-border)',
                    borderRadius: 24, padding: 32, zIndex: 900, backdropFilter: 'blur(40px)',
                    boxShadow: panelShadow,
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ padding: 8, background: 'rgba(0, 245, 212, 0.1)', borderRadius: 8 }}>
                            <Zap size={18} color="var(--accent-primary)" />
                        </div>
                        <span className="font-title" style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>Motor de Enfoque</span>
                    </div>
                    <button onClick={() => setIsMinimized(true)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><ChevronDown size={20} /></button>
                </div>

                <div style={{ display: 'flex', gap: 6, marginBottom: 32, background: tabBg, padding: 4, borderRadius: 12 }}>
                    {Object.entries(MODES).map(([key, val]) => (
                        <button key={key} onClick={() => switchMode(key)} style={{
                            flex: 1, padding: '10px 4px', borderRadius: 8, border: 'none',
                            background: mode === key ? tabActiveBg : 'transparent',
                            color: mode === key ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: 11, fontWeight: 700,
                            cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em'
                        }}>
                            {val.label.split(' ')[0]}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
                    <div style={{ position: 'relative', width: 180, height: 180 }}>
                        <svg width="180" height="180" viewBox="0 0 180 180" style={{ transform: 'rotate(-90deg)' }}>
                            <circle cx="90" cy="90" r="82" fill="none" stroke={trackColor} strokeWidth="4" />
                            <motion.circle cx="90" cy="90" r="82" fill="none" stroke="var(--accent-primary)" strokeWidth="4" strokeLinecap="round" strokeDasharray={2 * Math.PI * 82} animate={{ strokeDashoffset: 2 * Math.PI * 82 * (1 - progress / 100) }} transition={{ duration: 0.5 }} style={{ filter: 'drop-shadow(0 0 10px rgba(0, 245, 212, 0.2))' }} />
                        </svg>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ fontFamily: 'Space Grotesk', fontSize: 48, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{formatTime(timeLeft)}</div>
                            <div style={{ fontSize: 11, color: 'var(--accent-primary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.1em', marginTop: 4 }}>{currentMode.label}</div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 32 }}>
                    <button onClick={resetTimer} className="btn-wealth btn-wealth-outline" style={{ borderRadius: '50%', width: 52, height: 52, padding: 0, justifyContent: 'center' }}><RotateCcw size={18} /></button>
                    <button onClick={toggleTimer} className="btn-wealth" style={{ borderRadius: '50%', width: 72, height: 72, padding: 0, justifyContent: 'center' }}>{isRunning ? <Pause size={28} /> : <Play size={28} style={{ marginLeft: 4 }} />}</button>
                    <button onClick={() => switchMode(mode === 'focus' ? 'shortBreak' : 'focus')} className="btn-wealth btn-wealth-outline" style={{ borderRadius: '50%', width: 52, height: 52, padding: 0, justifyContent: 'center' }}><CheckCircle2 size={18} /></button>
                </div>

                <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                    <span>Ciclos Ejecutados</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i <= (sessions % 4 || (sessions > 0 && sessions % 4 === 0 ? 4 : 0)) ? 'var(--accent-primary)' : dotInactive }} />
                        ))}
                    </div>
                    <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{sessions}</span>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
