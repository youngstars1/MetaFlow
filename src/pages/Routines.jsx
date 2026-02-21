import { useState, useCallback, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import { SkeletonRoutines } from '../components/Skeleton';
import { calculateLevel, getLevelTitle, getXPForNextLevel, XP_REWARDS } from '../utils/gamification';
import { Plus, Trash2, Edit3, ShieldCheck, Zap, Activity, Book, Users, Target, CheckCircle2, Flame, Award, ChevronRight, Dumbbell, Wallet, Type, Tag, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Routines() {
    const { state, dispatch } = useApp();
    const { addToast } = useToast();
    const { routines, gamification, isLoaded } = state;
    const [showForm, setShowForm] = useState(false);
    const [editingRoutine, setEditingRoutine] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        category: 'dinero',
        frequency: 'daily',
        objective: '',
        difficulty: 'media'
    });

    const level = useMemo(() => calculateLevel(gamification.totalXP), [gamification.totalXP]);
    const xpProgress = useMemo(() => getXPForNextLevel(gamification.totalXP), [gamification.totalXP]);

    const handleComplete = useCallback((routine) => {
        const today = new Date().toDateString();
        const completedDates = routine.completedDates || [];

        if (completedDates.includes(today)) {
            addToast('Hábito ya completado hoy', { type: 'info' });
            return;
        }

        const xpBase = XP_REWARDS.ROUTINE_COMPLETE;
        const difficultyMultiplier = formData.difficulty === 'alta' ? 1.5 : formData.difficulty === 'baja' ? 0.8 : 1;
        const xpEarned = Math.round(xpBase * (routine.difficulty === 'alta' ? 1.5 : routine.difficulty === 'baja' ? 0.8 : 1));

        dispatch({
            type: 'COMPLETE_ROUTINE',
            payload: { id: routine.id, date: today, xp: xpEarned }
        });

        addToast(`¡Hábito cumplido! +${xpEarned} XP`, { type: 'success' });
    }, [dispatch, addToast, formData.difficulty]);

    const handleSubmit = useCallback((e) => {
        e.preventDefault();
        const routineData = {
            name: formData.name,
            category: formData.category,
            frequency: formData.frequency,
            objective: formData.objective,
            difficulty: formData.difficulty,
            streak: editingRoutine ? editingRoutine.streak : 0,
            completedDates: editingRoutine ? editingRoutine.completedDates : [],
        };

        if (editingRoutine) {
            dispatch({ type: 'UPDATE_ROUTINE', payload: { ...routineData, id: editingRoutine.id } });
            addToast('Hábito actualizado', { type: 'success' });
        } else {
            dispatch({ type: 'ADD_ROUTINE', payload: routineData });
            addToast('Nuevo hábito creado', { type: 'success' });
        }
        setShowForm(false);
        setEditingRoutine(null);
        setFormData({ name: '', category: 'dinero', frequency: 'daily', objective: '', difficulty: 'media' });
    }, [formData, editingRoutine, dispatch, addToast]);

    const openNew = useCallback(() => {
        setEditingRoutine(null);
        setFormData({ name: '', category: 'dinero', frequency: 'daily', objective: '', difficulty: 'media' });
        setShowForm(true);
    }, []);

    const openEdit = useCallback((routine) => {
        setEditingRoutine(routine);
        setFormData({
            name: routine.name,
            category: routine.category,
            frequency: routine.frequency,
            objective: routine.objective || '',
            difficulty: routine.difficulty || 'media'
        });
        setShowForm(true);
    }, []);

    const handleDelete = useCallback((id) => {
        dispatch({ type: 'DELETE_ROUTINE', payload: id });
        addToast('Hábito eliminado', { type: 'warning' });
    }, [dispatch, addToast]);

    const categories = {
        dinero: { label: 'Dinero y Ahorro', icon: <Wallet size={16} />, color: 'var(--accent-primary)' },
        salud: { label: 'Salud y Deporte', icon: <Dumbbell size={16} />, color: '#ff5d5d' },
        estudio: { label: 'Estudio y Lectura', icon: <Book size={16} />, color: '#70d6ff' },
        disciplina: { label: 'Mentalidad y Enfoque', icon: <Target size={16} />, color: '#a29bfe' },
        otros: { label: 'Otros Hábitos', icon: <Activity size={16} />, color: 'var(--text-muted)' },
    };

    const difficulties = {
        baja: { label: 'Baja', color: 'var(--accent-primary)', xp: 'x0.8' },
        media: { label: 'Media', color: 'var(--warning)', xp: 'x1.0' },
        alta: { label: 'Alta', color: 'var(--danger)', xp: 'x1.5' },
    };

    if (!isLoaded) return <div className="page-content"><SkeletonRoutines /></div>;

    return (
        <div className="page-content fade-and-slide">
            <div className="page-header" style={{ marginBottom: 48 }}>
                <div className="flex-between">
                    <div>
                        <h1 className="page-title" style={{ fontSize: 36 }}>Rutinas y Disciplina</h1>
                        <p className="page-subtitle">Construye la consistencia necesaria para tu éxito exponencial</p>
                    </div>
                    <button className="btn-wealth" onClick={openNew}>
                        <Plus size={18} /> Nuevo Hábito
                    </button>
                </div>
            </div>

            <div className="bento-grid" style={{ marginBottom: 48 }}>
                <div className="bento-span-8 card-wealth shimmer-metal">
                    <div style={{ color: 'var(--accent-primary)', marginBottom: 8 }}><Award size={24} /></div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Estado de Autoridad</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div style={{ fontSize: 24, fontWeight: 700 }}>{getLevelTitle(level)} - Nivel {level}</div>
                        <div style={{ fontSize: 13 }}>{xpProgress.progress}% para sig. nivel</div>
                    </div>
                    <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, marginTop: 12, overflow: 'hidden' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${xpProgress.progress}%` }} style={{ height: '100%', background: 'var(--accent-gradient)', boxShadow: '0 0 10px rgba(0,245,212,0.3)' }} />
                    </div>
                </div>
                <div className="bento-span-4 card-wealth">
                    <div style={{ color: 'var(--accent-warm)', marginBottom: 8 }}><Flame size={24} /></div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Racha de Consistencia</div>
                    <div style={{ fontSize: 24, fontWeight: 700 }}>{routines.reduce((acc, r) => Math.max(acc, r.streak || 0), 0)} días seguidos</div>
                </div>
            </div>

            <div className="bento-grid">
                {routines.length === 0 ? (
                    <div className="bento-span-12 card-wealth" style={{ textAlign: 'center', padding: 60, opacity: 0.5 }}>
                        <Zap size={48} strokeWidth={1} style={{ marginBottom: 16, color: 'var(--accent-primary)' }} />
                        <p>No tienes rutinas configuradas. Tu nuevo yo empieza con el primer hábito.</p>
                        <button className="btn-wealth" style={{ marginTop: 24 }} onClick={openNew}>Programar mi primera rutina</button>
                    </div>
                ) : (
                    routines.map(routine => {
                        const isCompletedToday = (routine.completedDates || []).includes(new Date().toDateString());
                        return (
                            <div key={routine.id} className="bento-span-4 card-wealth" style={{
                                borderLeft: `4px solid ${categories[routine.category]?.color || 'var(--accent-primary)'}`,
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                <div className="flex-between" style={{ marginBottom: 16 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{ color: categories[routine.category]?.color }}>{categories[routine.category]?.icon}</div>
                                        <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{categories[routine.category]?.label}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button onClick={() => openEdit(routine)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}><Edit3 size={14} /></button>
                                        <button onClick={() => handleDelete(routine.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', opacity: 0.5, cursor: 'pointer', padding: 4 }}><Trash2 size={14} /></button>
                                    </div>
                                </div>
                                <h3 className="font-title" style={{ fontSize: 18, marginBottom: 8 }}>{routine.name}</h3>
                                {routine.objective && (
                                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20, fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <ShieldCheck size={12} /> {routine.objective}
                                    </p>
                                )}

                                <div style={{ marginTop: 'auto' }}>
                                    <div className="flex-between" style={{ marginBottom: 16 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <Flame size={14} color={routine.streak > 0 ? "var(--warning)" : "var(--text-muted)"} />
                                                <span style={{ fontSize: 13, fontWeight: 700 }}>{routine.streak || 0}</span>
                                            </div>
                                            <div style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.05)', color: difficulties[routine.difficulty || 'media'].color }}>
                                                {difficulties[routine.difficulty || 'media'].label}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleComplete(routine)}
                                        className={`btn-wealth ${isCompletedToday ? '' : 'btn-wealth-outline'}`}
                                        disabled={isCompletedToday}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            fontSize: 12,
                                            background: isCompletedToday ? 'rgba(0, 245, 212, 0.05)' : '',
                                            color: isCompletedToday ? 'var(--accent-primary)' : '',
                                            borderColor: isCompletedToday ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        {isCompletedToday ? <><CheckCircle2 size={14} /> Completado</> : 'Marcar como cumplido'}
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingRoutine ? 'Configurar Rutina' : 'Nueva Rutina de Disciplina'}>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label" style={{ fontSize: 11, opacity: 0.7 }}>NOMBRE DEL HÁBITO / RUTINA</label>
                        <div style={{ position: 'relative' }}>
                            <Type size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input className="wealth-input" style={{ paddingLeft: 40 }} placeholder="Ej: Revisar matriz de capital, Lectura técnica..." value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required autoFocus />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label" style={{ fontSize: 11, opacity: 0.7 }}>OBJETIVO / POR QUÉ (DISCIPLINA)</label>
                        <div style={{ position: 'relative' }}>
                            <ShieldCheck size={14} style={{ position: 'absolute', left: 14, top: 18, color: 'var(--text-muted)' }} />
                            <textarea className="wealth-input" style={{ paddingLeft: 40, paddingTop: 14, minHeight: 80, resize: 'none' }} placeholder="¿Cómo te ayuda esto a tu libertad financiera?" value={formData.objective} onChange={e => setFormData({ ...formData, objective: e.target.value })} />
                        </div>
                    </div>

                    <div className="bento-grid" style={{ gridAutoRows: 'auto', gap: 16 }}>
                        <div className="bento-span-6 form-group">
                            <label className="form-label" style={{ fontSize: 11, opacity: 0.7 }}>CATEGORÍA</label>
                            <div style={{ position: 'relative' }}>
                                <Tag size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 1 }} />
                                <select className="wealth-input" style={{ paddingLeft: 40, background: '#1c1c1d' }} value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} required>
                                    {Object.entries(categories).map(([val, data]) => (
                                        <option key={val} value={val}>{data.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="bento-span-6 form-group">
                            <label className="form-label" style={{ fontSize: 11, opacity: 0.7 }}>DIFICULTAD</label>
                            <div style={{ position: 'relative' }}>
                                <Zap size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 1 }} />
                                <select className="wealth-input" style={{ paddingLeft: 40, background: '#1c1c1d' }} value={formData.difficulty} onChange={e => setFormData({ ...formData, difficulty: e.target.value })} required>
                                    {Object.entries(difficulties).map(([val, data]) => (
                                        <option key={val} value={val}>{data.label} ({data.xp} XP)</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 32 }}>
                        <label className="form-label" style={{ fontSize: 11, opacity: 0.7 }}>FRECUENCIA DE EJECUCIÓN</label>
                        <div style={{ position: 'relative' }}>
                            <Activity size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 1 }} />
                            <select className="wealth-input" style={{ paddingLeft: 40, background: '#1c1c1d' }} value={formData.frequency} onChange={e => setFormData({ ...formData, frequency: e.target.value })} required>
                                <option value="daily">Diariamente (Consistencia Total)</option>
                                <option value="weekdays">Días laborales (Protocolo Semanal)</option>
                                <option value="weekly">Semanalmente (Revisión de Enfoque)</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-actions" style={{ border: 'none', padding: 0 }}>
                        <button type="button" className="btn-wealth btn-wealth-outline" style={{ height: 48, paddingInline: 24 }} onClick={() => setShowForm(false)}>Cancelar</button>
                        <button type="submit" className="btn-wealth" style={{ flex: 1, height: 48, justifyContent: 'center' }}>
                            {editingRoutine ? 'Guardar Cambios de Protocolo' : 'Iniciar Nueva Rutina'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
