import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, CheckCircle, Sparkles, Target, BarChart3, Zap, Shield, ShieldCheck, Activity, TrendingUp, Cpu, Wallet, Repeat } from 'lucide-react';

const STEPS = [
    {
        icon: <Sparkles size={48} />,
        title: 'Bienvenido a MetaFlow',
        subtitle: 'Disciplina Financiera de Alto Nivel',
        description: 'La herramienta definitiva para tomar el control de tu dinero y alcanzar tus objetivos con una metodología basada en la disciplina y el hábito.',
        color: '#00f5d4',
    },
    {
        icon: <Target size={48} />,
        title: 'Define tus Metas',
        subtitle: 'Visualiza lo que quieres lograr',
        description: 'Crea metas claras para tus ahorros: un viaje, una casa, un fondo de emergencia. Calcula cuánto necesitas y nosotros te ayudamos a seguir el camino.',
        color: '#00b4d8',
    },
    {
        icon: <Wallet size={48} />,
        title: 'Controla tus Movimientos',
        subtitle: 'Sabe exactamente a dónde va tu dinero',
        description: 'Registra tus ingresos y gastos de forma rápida. La clave del éxito financiero es conocer tu flujo de caja real cada día.',
        color: '#00f5d4',
    },
    {
        icon: <Repeat size={48} />,
        title: 'Disciplina Diaria',
        subtitle: 'Construye hábitos que duren',
        description: 'Usa nuestra sección de hábitos para mantenerte enfocado. Crea rachas, gana experiencia y sube de nivel mientras mejoras tu vida financiera.',
        color: '#00f5d4',
    },
    {
        icon: <ShieldCheck size={48} />,
        title: 'Tus Datos, Tu Privacidad',
        subtitle: 'Seguridad y autonomía total',
        description: 'Toda tu información está protegida. Puedes usar el Modo Incógnito para ocultar tus montos en público y sincronizar tus datos con la nube.',
        color: '#00f5d4',
    },
];

export default function Onboarding({ onComplete }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [direction, setDirection] = useState(1);

    const step = STEPS[currentStep];
    const isLast = currentStep === STEPS.length - 1;

    const goNext = useCallback(() => {
        if (isLast) {
            localStorage.setItem('metaflow_onboarded', 'true');
            onComplete();
        } else {
            setDirection(1);
            setCurrentStep(prev => prev + 1);
        }
    }, [isLast, onComplete]);

    const goPrev = useCallback(() => {
        if (currentStep > 0) {
            setDirection(-1);
            setCurrentStep(prev => prev - 1);
        }
    }, [currentStep]);

    const skip = useCallback(() => {
        localStorage.setItem('metaflow_onboarded', 'true');
        onComplete();
    }, [onComplete]);

    const variants = {
        enter: (dir) => ({ x: dir > 0 ? 100 : -100, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (dir) => ({ x: dir > 0 ? -100 : 100, opacity: 0 }),
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'var(--bg-primary)', zIndex: 10000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
        }}>
            <div className="giant-metric" style={{ top: '10%', left: '10%', fontSize: 200, opacity: 0.03 }}>META</div>

            <div style={{ width: '100%', maxWidth: 520, padding: '0 24px', position: 'relative', zIndex: 1 }}>
                <button onClick={skip} style={{ position: 'absolute', top: -80, right: 0, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Saltar Introducción →
                </button>

                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={currentStep}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        style={{ textAlign: 'center' }}
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            style={{
                                width: 120, height: 120, borderRadius: 24,
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(0, 245, 212, 0.2)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 40px', color: 'var(--accent-primary)',
                                boxShadow: '0 0 50px rgba(0, 245, 212, 0.05)',
                            }}
                        >
                            {step.icon}
                        </motion.div>

                        <h1 className="font-title" style={{ fontSize: 36, fontWeight: 700, marginBottom: 12, color: '#fff', letterSpacing: '-0.02em' }}>
                            {step.title}
                        </h1>

                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 24 }}>
                            {step.subtitle}
                        </p>

                        <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.8, maxWidth: 440, margin: '0 auto' }}>
                            {step.description}
                        </p>
                    </motion.div>
                </AnimatePresence>

                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, margin: '48px 0 48px' }}>
                    {STEPS.map((_, idx) => (
                        <div key={idx} style={{
                            width: idx === currentStep ? 32 : 8, height: 4, borderRadius: 2,
                            background: idx === currentStep ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)',
                            transition: 'all 0.4s ease'
                        }} />
                    ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
                    {currentStep > 0 && (
                        <button onClick={goPrev} className="btn-wealth btn-wealth-outline" style={{ paddingInline: 24 }}>
                            <ArrowLeft size={16} /> Atrás
                        </button>
                    )}
                    <button onClick={goNext} className="btn-wealth" style={{ minWidth: 200, justifyContent: 'center' }}>
                        {isLast ? <>Empezar Ahora <CheckCircle size={18} /></> : <>Siguiente <ArrowRight size={18} /></>}
                    </button>
                </div>

                <div style={{ textAlign: 'center', marginTop: 64, fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.2em' }}>
                    DISEÑADO PARA TU ÉXITO POR YOUNGSTARS
                </div>
            </div>
        </div>
    );
}
