import { useMemo, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { usePrivacy, PrivacyAmount } from '../context/PrivacyContext';
import { useTheme } from '../context/ThemeContext';
import { SkeletonStatCards, SkeletonGoalCards } from '../components/Skeleton';
import {
    formatCurrency,
    getProgressPercentage,
    formatDateShort,
} from '../utils/helpers';
import { calculateLevel, getLevelTitle, getXPForNextLevel, getLevelIcon, evaluateBadges, countEarnedBadges, BADGES } from '../utils/gamification';
import { generateDailyMissions, calculateDecisionMetrics, detectDayPatterns, detectCategoryTrends } from '../utils/patterns';
import { time } from '../utils/timeEngine';
import EmailVerificationBanner from '../components/EmailVerification';
import {
    TrendingUp, TrendingDown, Target, Zap, Eye, EyeOff,
    PiggyBank, ArrowUpRight, ArrowDownRight, Award, Activity,
    Flame, Plus, ShieldCheck, Trophy, Gem, Crown, BarChart3,
    Wallet, Layers, Calendar, AlertTriangle, Info, CheckCircle,
    Shield, Receipt, Heart
} from 'lucide-react';

// Helper to detect transaction type regardless of language
const isIncome = (t) => t.type === 'income' || t.type === 'ingreso';
const isExpense = (t) => t.type === 'expense' || t.type === 'gasto';
const isSavings = (t) => t.type === 'savings' || t.type === 'ahorro';

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.05, delayChildren: 0.08 }
    },
};

const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
};

const BADGE_ICONS = {
    Zap, ShieldCheck, Shield: ShieldCheck, Gem, TrendingUp, Wallet,
    Crown, Trophy, Activity, BarChart3, Target, Layers, Heart
};

const MISSION_ICONS = {
    Receipt, CheckCircle, PiggyBank, Shield
};

export default function Dashboard() {
    const { isDark } = useTheme();
    const { state, dispatch } = useApp();
    const { addToast } = useToast();
    const { isPrivate, togglePrivacy } = usePrivacy();
    const { goals, transactions, routines, gamification, isLoaded } = state;

    const [quickAmount, setQuickAmount] = useState('');

    // ===== MEMOIZED STATS (handles both type formats) =====
    const stats = useMemo(() => {
        const income = transactions
            .filter(isIncome)
            .reduce((s, t) => s + Math.abs(t.amount), 0);
        const expenses = transactions
            .filter(isExpense)
            .reduce((s, t) => s + Math.abs(t.amount), 0);
        const totalSaved = goals.reduce((s, g) => s + (g.currentAmount || 0), 0);
        const balance = income - expenses;
        const savingsRate = income > 0 ? Math.round((balance / income) * 100) : 0;

        return { income, expenses, totalSaved, balance, savingsRate };
    }, [transactions, goals]);

    const topGoals = useMemo(() =>
        goals
            .filter(g => g.targetAmount > 0)
            .sort((a, b) => (b.priority === 'high' ? 1 : 0) - (a.priority === 'high' ? 1 : 0))
            .slice(0, 4),
        [goals]
    );

    const recentTransactions = useMemo(() => transactions.slice(0, 5), [transactions]);

    const level = useMemo(() => calculateLevel(gamification.totalXP), [gamification.totalXP]);
    const levelTitle = useMemo(() => getLevelTitle(level), [level]);
    const xpProgress = useMemo(() => getXPForNextLevel(gamification.totalXP), [gamification.totalXP]);
    const levelIcon = useMemo(() => getLevelIcon(level), [level]);
    const earnedBadgeCount = useMemo(() => countEarnedBadges(state), [state]);
    const allBadges = useMemo(() => evaluateBadges(state), [state]);

    const todaysRoutines = useMemo(() => {
        const today = time.todayString();
        const total = routines.length;
        const completed = routines.filter(r =>
            (r.completedDates || []).includes(today)
        ).length;
        return { total, completed, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
    }, [routines]);

    // Daily missions
    const missions = useMemo(() => generateDailyMissions(state), [state]);
    const completedMissions = useMemo(() => missions.filter(m => m.completed).length, [missions]);

    // Pattern detection
    const decisionMetrics = useMemo(() => calculateDecisionMetrics(transactions), [transactions]);
    const dayPatterns = useMemo(() => detectDayPatterns(transactions), [transactions]);
    const categoryTrends = useMemo(() => detectCategoryTrends(transactions), [transactions]);
    const allInsights = useMemo(() => [
        ...decisionMetrics.insights,
        ...dayPatterns.map(p => ({ type: 'info', icon: p.icon, message: p.message })),
        ...categoryTrends.map(t => ({ type: t.type === 'increase' ? 'warning' : 'success', icon: t.icon, message: t.message })),
    ].slice(0, 4), [decisionMetrics, dayPatterns, categoryTrends]);

    const handleQuickTransaction = useCallback((type) => {
        const amount = parseFloat(quickAmount);
        if (!amount || amount <= 0) {
            addToast('Ingresa un monto válido', { type: 'warning' });
            return;
        }
        dispatch({
            type: 'ADD_TRANSACTION',
            payload: {
                amount,
                type: type === 'ingreso' ? 'ingreso' : 'gasto',
                category: type === 'ingreso' ? 'otros_ingresos' : 'otros_gastos',
                note: 'Registro rápido',
                date: new Date().toISOString(),
            }
        });
        addToast(
            type === 'ingreso' ? `Ingreso: ${formatCurrency(amount)}` : `Gasto: ${formatCurrency(amount)}`,
            { type: type === 'ingreso' ? 'success' : 'info', xpAmount: 10 }
        );
        setQuickAmount('');
    }, [quickAmount, dispatch, addToast]);

    if (!isLoaded) {
        return (
            <div className="page-content">
                <SkeletonStatCards />
                <SkeletonGoalCards />
            </div>
        );
    }

    return (
        <motion.div
            className="page-content"
            variants={container}
            initial="hidden"
            animate="show"
        >
            {/* Email Verification Banner */}
            <EmailVerificationBanner />

            {/* ===== HERO CARD — like the screenshot ===== */}
            <motion.div
                variants={item}
                style={{
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: 20,
                    padding: '40px 40px 32px',
                    background: isDark
                        ? 'linear-gradient(135deg, #0f1219 0%, #111827 50%, #0a0e1a 100%)'
                        : 'linear-gradient(135deg, #f8f9fc 0%, #eef1f6 50%, #e8ecf2 100%)',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)'}`,
                    marginBottom: 28,
                }}
            >
                {/* MetaFlow Logo watermark */}
                <img
                    src="/metaflow.svg"
                    alt=""
                    style={{
                        position: 'absolute',
                        right: 20,
                        bottom: 16,
                        width: 80,
                        height: 80,
                        opacity: isDark ? 0.25 : 0.12,
                        pointerEvents: 'none',
                        userSelect: 'none',
                    }}
                />

                {/* Giant watermark text */}
                <div style={{
                    position: 'absolute',
                    right: -20,
                    bottom: -30,
                    fontSize: 140,
                    fontWeight: 900,
                    fontFamily: 'Space Grotesk',
                    color: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)',
                    letterSpacing: '-0.04em',
                    userSelect: 'none',
                    pointerEvents: 'none',
                    lineHeight: 1,
                }}>
                    METAFLOW
                </div>

                {/* Header with privacy toggle */}
                <div className="flex-between" style={{ marginBottom: 32 }}>
                    <div>
                        <div style={{
                            fontSize: 11,
                            color: 'var(--text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.12em',
                            marginBottom: 6,
                        }}>
                            CAPITAL DESTINADO A METAS
                        </div>
                        <PrivacyAmount>
                            <div style={{
                                fontSize: 52,
                                fontWeight: 800,
                                fontFamily: 'Space Grotesk',
                                color: 'var(--text-primary)',
                                letterSpacing: '-0.03em',
                                lineHeight: 1.1,
                            }}>
                                {formatCurrency(stats.totalSaved)}
                            </div>
                        </PrivacyAmount>
                    </div>
                    <button
                        onClick={togglePrivacy}
                        style={{
                            background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                            borderRadius: 10,
                            padding: '8px 14px',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: 12,
                            transition: 'all 0.2s',
                        }}
                        aria-label={isPrivate ? 'Mostrar montos' : 'Ocultar montos'}
                    >
                        {isPrivate ? <EyeOff size={14} /> : <Eye size={14} />}
                        {isPrivate ? 'Mostrar' : 'Ocultar'}
                    </button>
                </div>

                {/* Bottom stats row */}
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
                    <div style={{ display: 'flex', gap: 32 }}>
                        <div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                                INGRESOS
                            </div>
                            <PrivacyAmount>
                                <span style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Space Grotesk', color: 'var(--accent-primary)' }}>
                                    + {formatCurrency(stats.income)}
                                </span>
                            </PrivacyAmount>
                        </div>
                        <div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                                GASTOS
                            </div>
                            <PrivacyAmount>
                                <span style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Space Grotesk', color: '#ff5d5d' }}>
                                    - {formatCurrency(stats.expenses)}
                                </span>
                            </PrivacyAmount>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                            SALDO ACTUAL
                        </div>
                        <PrivacyAmount>
                            <span style={{
                                fontSize: 24,
                                fontWeight: 800,
                                fontFamily: 'Space Grotesk',
                                color: stats.balance >= 0 ? 'var(--text-primary)' : '#ff5d5d',
                            }}>
                                {stats.balance >= 0 ? '' : '-'}{formatCurrency(Math.abs(stats.balance))}
                            </span>
                        </PrivacyAmount>
                    </div>
                </div>
            </motion.div>

            {/* ===== BENTO GRID ===== */}
            <div className="bento-grid">

                {/* Quick Transaction */}
                <motion.div variants={item} className="card-wealth bento-span-4">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <Plus size={16} color="var(--accent-primary)" />
                        <h3 className="font-title" style={{ fontSize: 15, fontWeight: 600 }}>Acción Rápida</h3>
                    </div>
                    <input
                        type="number"
                        className="wealth-input"
                        placeholder="Monto..."
                        value={quickAmount}
                        onChange={e => setQuickAmount(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleQuickTransaction('ingreso')}
                        style={{ marginBottom: 12 }}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button
                            className="btn-wealth"
                            style={{ flex: 1, fontSize: 12, justifyContent: 'center' }}
                            onClick={() => handleQuickTransaction('ingreso')}
                        >
                            <ArrowUpRight size={14} /> Ingreso
                        </button>
                        <button
                            className="btn-wealth btn-wealth-outline"
                            style={{ flex: 1, fontSize: 12, justifyContent: 'center', borderColor: 'rgba(255, 93, 93, 0.3)', color: '#ff5d5d' }}
                            onClick={() => handleQuickTransaction('gasto')}
                        >
                            <ArrowDownRight size={14} /> Gasto
                        </button>
                    </div>
                </motion.div>

                {/* Level & XP */}
                <motion.div variants={item} className="card-wealth bento-span-4 shimmer-metal">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <Award size={16} color="var(--accent-primary)" />
                        <h3 className="font-title" style={{ fontSize: 15, fontWeight: 600 }}>Tu Progreso</h3>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                        <span style={{ fontSize: 36 }}>{levelIcon}</span>
                        <div>
                            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Space Grotesk', color: 'var(--text-primary)' }}>{levelTitle}</div>
                            <div style={{ fontSize: 12, color: 'var(--accent-primary)' }}>Nivel {level} · {gamification.totalXP.toLocaleString()} XP</div>
                        </div>
                    </div>
                    <div className="liquid-progress" style={{ height: 8 }}>
                        <motion.div
                            className="liquid-progress-fill"
                            initial={{ width: 0 }}
                            animate={{ width: `${xpProgress.progress}%` }}
                            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                        />
                    </div>
                    <div className="flex-between" style={{ marginTop: 8 }}>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{xpProgress.current} / {xpProgress.needed} XP</span>
                        <span className="stat-pill positive" style={{ fontSize: 10 }}>
                            <Flame size={10} />
                            {earnedBadgeCount}/{BADGES.length} medallas
                        </span>
                    </div>
                </motion.div>

                {/* Routines Today */}
                <motion.div variants={item} className="card-wealth bento-span-4">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <Activity size={16} color="var(--accent-primary)" />
                        <h3 className="font-title" style={{ fontSize: 15, fontWeight: 600 }}>Disciplina del Día</h3>
                    </div>
                    <div style={{ textAlign: 'center', padding: '8px 0' }}>
                        <div style={{ fontSize: 48, fontWeight: 800, fontFamily: 'Space Grotesk', color: todaysRoutines.percent === 100 ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                            {todaysRoutines.percent}%
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                            {todaysRoutines.completed} de {todaysRoutines.total} completados
                        </div>
                        <div className="liquid-progress" style={{ height: 6 }}>
                            <motion.div
                                className="liquid-progress-fill"
                                initial={{ width: 0 }}
                                animate={{ width: `${todaysRoutines.percent}%` }}
                                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                            />
                        </div>
                    </div>
                </motion.div>

                {/* ===== DAILY MISSIONS ===== */}
                <motion.div variants={item} className="card-wealth bento-span-6">
                    <div className="flex-between" style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Zap size={16} color="var(--accent-warm)" />
                            <h3 className="font-title" style={{ fontSize: 15, fontWeight: 600 }}>Misiones del Día</h3>
                        </div>
                        <span className="stat-pill positive" style={{ fontSize: 10 }}>
                            {completedMissions}/{missions.length}
                        </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {missions.map(m => {
                            const MIcon = MISSION_ICONS[m.icon] || Zap;
                            return (
                                <div key={m.id} style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '10px 12px', borderRadius: 10,
                                    background: m.completed ? 'rgba(0,245,212,0.04)' : 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${m.completed ? 'rgba(0,245,212,0.12)' : 'rgba(255,255,255,0.04)'}`,
                                    transition: 'all 0.3s',
                                }}>
                                    <div style={{
                                        width: 28, height: 28, borderRadius: 8,
                                        background: m.completed ? 'rgba(0,245,212,0.1)' : 'rgba(255,255,255,0.04)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        {m.completed ? <CheckCircle size={14} color="var(--accent-primary)" /> : <MIcon size={14} color="var(--text-muted)" />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 13, fontWeight: 500, color: m.completed ? 'var(--accent-primary)' : 'var(--text-primary)', textDecoration: m.completed ? 'line-through' : 'none', opacity: m.completed ? 0.7 : 1 }}>
                                            {m.title}
                                        </div>
                                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{m.description}</div>
                                    </div>
                                    <span className={`stat-pill ${m.difficulty === 'fácil' ? 'neutral' : m.difficulty === 'media' ? 'positive' : 'warning'}`} style={{ fontSize: 9 }}>
                                        +{m.xp} XP
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* ===== PATTERN DETECTION / INSIGHTS ===== */}
                <motion.div variants={item} className="card-wealth bento-span-6">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <BarChart3 size={16} color="#70d6ff" />
                        <h3 className="font-title" style={{ fontSize: 15, fontWeight: 600 }}>Inteligencia Financiera</h3>
                    </div>

                    {/* Decision metrics */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
                        <div style={{ textAlign: 'center', padding: '12px 8px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                            <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'Space Grotesk', color: decisionMetrics.impulseIndex > 30 ? '#ff5d5d' : 'var(--accent-primary)' }}>
                                {decisionMetrics.impulseIndex}%
                            </div>
                            <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Impulso</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '12px 8px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                            <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'Space Grotesk', color: '#70d6ff' }}>
                                {decisionMetrics.investmentRatio}%
                            </div>
                            <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Inversión</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '12px 8px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                            <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'Space Grotesk', color: 'var(--accent-warm)' }}>
                                {decisionMetrics.optimizationLevel}
                            </div>
                            <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Optimización</div>
                        </div>
                    </div>

                    {/* Smart Insights */}
                    {allInsights.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {allInsights.map((insight, i) => {
                                const IIcon = insight.icon === 'AlertTriangle' ? AlertTriangle : insight.icon === 'ShieldCheck' ? ShieldCheck : insight.icon === 'TrendingUp' ? TrendingUp : insight.icon === 'TrendingDown' ? TrendingDown : insight.icon === 'Calendar' ? Calendar : Info;
                                return (
                                    <div key={i} style={{
                                        display: 'flex', alignItems: 'flex-start', gap: 8,
                                        padding: '8px 10px', borderRadius: 8,
                                        background: insight.type === 'warning' ? 'rgba(255,93,93,0.04)' : insight.type === 'success' ? 'rgba(0,245,212,0.04)' : 'rgba(112,214,255,0.04)',
                                        fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4,
                                    }}>
                                        <IIcon size={14} color={insight.type === 'warning' ? '#ff5d5d' : insight.type === 'success' ? 'var(--accent-primary)' : '#70d6ff'} style={{ flexShrink: 0, marginTop: 2 }} />
                                        {insight.message}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-muted)', fontSize: 12 }}>
                            Registra más movimientos para activar la inteligencia financiera.
                        </div>
                    )}
                </motion.div>

                {/* Top Goals */}
                <motion.div variants={item} className="card-wealth bento-span-8">
                    <div className="flex-between" style={{ marginBottom: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Target size={16} color="var(--accent-primary)" />
                            <h3 className="font-title" style={{ fontSize: 15, fontWeight: 600 }}>Metas Activas</h3>
                        </div>
                        <span className="stat-pill neutral">{goals.length} metas</span>
                    </div>
                    {topGoals.length === 0 ? (
                        <div className="empty-state" style={{ padding: '40px 20px' }}>
                            <Target size={32} className="empty-state-icon" />
                            <h2 style={{ fontSize: 16 }}>Sin metas aún</h2>
                            <p style={{ fontSize: 12 }}>Crea tu primera meta para empezar a construir tu futuro financiero.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                            {topGoals.map(goal => {
                                const progress = getProgressPercentage(goal.currentAmount || 0, goal.targetAmount);
                                return (
                                    <div key={goal.id} style={{
                                        padding: 16, borderRadius: 10,
                                        background: 'rgba(255,255,255,0.02)',
                                        border: '1px solid var(--border-color)',
                                    }}>
                                        <div className="flex-between" style={{ marginBottom: 8 }}>
                                            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                                                {goal.name}
                                            </span>
                                            <span style={{ fontSize: 11, fontFamily: 'Space Grotesk', fontWeight: 700, color: progress >= 100 ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                                                {progress}%
                                            </span>
                                        </div>
                                        <div className="liquid-progress" style={{ height: 4, marginBottom: 8 }}>
                                            <div className="liquid-progress-fill" style={{ width: `${Math.min(100, progress)}%` }} />
                                        </div>
                                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                                            <PrivacyAmount>{formatCurrency(goal.currentAmount || 0)}</PrivacyAmount>
                                            {' / '}
                                            <PrivacyAmount>{formatCurrency(goal.targetAmount)}</PrivacyAmount>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </motion.div>

                {/* Badges Showcase */}
                <motion.div variants={item} className="card-wealth bento-span-4">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <Award size={16} color="var(--accent-warm)" />
                        <h3 className="font-title" style={{ fontSize: 15, fontWeight: 600 }}>Medallas</h3>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                        {allBadges.slice(0, 6).map(badge => {
                            const IconComp = BADGE_ICONS[badge.icon] || Award;
                            return (
                                <div key={badge.id} className={`badge-card ${badge.earned ? 'earned' : 'locked'}`}>
                                    {badge.earned && <div className="badge-dot" />}
                                    <IconComp size={20} color={badge.earned ? 'var(--accent-primary)' : 'var(--text-muted)'} />
                                    <span className="badge-name">{badge.name}</span>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Recent Transactions */}
                <motion.div variants={item} className="card-wealth bento-span-12">
                    <div className="flex-between" style={{ marginBottom: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Wallet size={16} color="var(--accent-primary)" />
                            <h3 className="font-title" style={{ fontSize: 15, fontWeight: 600 }}>Últimos Movimientos</h3>
                        </div>
                        <span className="stat-pill neutral">{transactions.length} totales</span>
                    </div>
                    {recentTransactions.length === 0 ? (
                        <div className="empty-state" style={{ padding: '32px 20px' }}>
                            <Wallet size={28} className="empty-state-icon" />
                            <p style={{ fontSize: 13 }}>Aún no has registrado movimientos financieros.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {recentTransactions.map(t => (
                                <div key={t.id} style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '10px 12px', borderRadius: 8,
                                    background: 'rgba(255,255,255,0.01)',
                                    transition: 'all 0.2s'
                                }}>
                                    <div style={{
                                        width: 32, height: 32, borderRadius: 8,
                                        background: isIncome(t) ? 'rgba(0, 245, 212, 0.08)' : isExpense(t) ? 'rgba(255, 93, 93, 0.08)' : 'rgba(112, 214, 255, 0.08)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        {isIncome(t) ? <ArrowUpRight size={14} color="var(--accent-primary)" /> :
                                            isExpense(t) ? <ArrowDownRight size={14} color="#ff5d5d" /> :
                                                <PiggyBank size={14} color="#70d6ff" />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 13, fontWeight: 500 }}>{t.note || t.category || 'Sin nota'}</div>
                                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                                            {t.category} · {formatDateShort(t.date || t.createdAt)}
                                        </div>
                                    </div>
                                    <PrivacyAmount>
                                        <span style={{
                                            fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 14,
                                            color: isIncome(t) ? 'var(--accent-primary)' : isExpense(t) ? '#ff5d5d' : '#70d6ff'
                                        }}>
                                            {isExpense(t) ? '-' : '+'}{formatCurrency(Math.abs(t.amount))}
                                        </span>
                                    </PrivacyAmount>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>
        </motion.div>
    );
}
