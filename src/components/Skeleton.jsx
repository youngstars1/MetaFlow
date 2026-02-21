import { memo } from 'react';

const shimmerStyle = {
    background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 75%)',
    backgroundSize: '200% 100%',
    animation: 'skeleton-shimmer 1.5s ease-in-out infinite',
    borderRadius: 8,
};

function SkeletonBlock({ width = '100%', height = 16, radius = 8, style = {} }) {
    return (
        <div
            className="skeleton-block"
            style={{
                ...shimmerStyle,
                width,
                height,
                borderRadius: radius,
                ...style,
            }}
            aria-hidden="true"
        />
    );
}

export function SkeletonStatCards() {
    return (
        <div className="stats-grid" aria-busy="true" aria-label="Cargando estadísticas">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="stat-card" style={{ opacity: 0.6 }}>
                    <SkeletonBlock width={44} height={44} radius={12} style={{ marginBottom: 16 }} />
                    <SkeletonBlock width="60%" height={12} style={{ marginBottom: 8 }} />
                    <SkeletonBlock width="80%" height={28} style={{ marginBottom: 8 }} />
                    <SkeletonBlock width="40%" height={20} radius={20} />
                </div>
            ))}
        </div>
    );
}

export function SkeletonGoalCards() {
    return (
        <div className="goals-grid" aria-busy="true" aria-label="Cargando metas">
            {[1, 2, 3].map(i => (
                <div key={i} className="goal-card" style={{ opacity: 0.6 }}>
                    <SkeletonBlock width="100%" height={140} radius={0} />
                    <div style={{ padding: 20 }}>
                        <SkeletonBlock width="70%" height={20} style={{ marginBottom: 12 }} />
                        <SkeletonBlock width="100%" height={10} radius={20} style={{ marginBottom: 16 }} />
                        <SkeletonBlock width="50%" height={14} style={{ marginBottom: 8 }} />
                        <SkeletonBlock width="40%" height={14} />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function SkeletonTransactions() {
    return (
        <div className="transaction-list" aria-busy="true" aria-label="Cargando movimientos">
            {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="transaction-item" style={{ opacity: 0.6 }}>
                    <SkeletonBlock width={44} height={44} radius={12} />
                    <div style={{ flex: 1 }}>
                        <SkeletonBlock width="40%" height={14} style={{ marginBottom: 6 }} />
                        <SkeletonBlock width="60%" height={12} />
                    </div>
                    <div>
                        <SkeletonBlock width={80} height={16} style={{ marginBottom: 4 }} />
                        <SkeletonBlock width={60} height={12} />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function SkeletonRoutines() {
    return (
        <div className="routines-list" aria-busy="true" aria-label="Cargando rutinas">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="routine-item" style={{ opacity: 0.6 }}>
                    <SkeletonBlock width={26} height={26} radius={8} />
                    <div style={{ flex: 1 }}>
                        <SkeletonBlock width="50%" height={14} style={{ marginBottom: 6 }} />
                        <SkeletonBlock width="30%" height={12} />
                    </div>
                    <SkeletonBlock width={60} height={24} radius={20} />
                </div>
            ))}
        </div>
    );
}

export function SkeletonChart() {
    return (
        <div className="chart-card" style={{ opacity: 0.6 }} aria-busy="true" aria-label="Cargando gráfico">
            <SkeletonBlock width="40%" height={16} style={{ marginBottom: 20 }} />
            <SkeletonBlock width="100%" height={250} radius={12} />
        </div>
    );
}

export default memo(SkeletonBlock);
