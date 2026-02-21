import { getProgressPercentage } from '../utils/helpers';
import { motion } from 'framer-motion';

export default function WealthRing({ current, target, size = 100, strokeWidth = 4 }) {
    const percentage = getProgressPercentage(current, target);
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="circular-progress-wealth" style={{
            width: size, height: size,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                {/* Background Ring */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="rgba(255,255,255,0.03)"
                    strokeWidth={strokeWidth}
                    fill="none"
                />

                {/* Glow Ring (Blur effect) */}
                <motion.circle
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="var(--accent-primary)"
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeLinecap="round"
                    style={{ filter: 'blur(4px)', opacity: 0.4 }}
                />

                {/* Main Progress Ring */}
                <motion.circle
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="var(--accent-primary)"
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeLinecap="round"
                    className="ring-glow"
                />
            </svg>
            <div
                className="font-title"
                style={{
                    position: 'absolute',
                    fontSize: size * 0.22,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.02em',
                    fontFamily: 'Space Grotesk'
                }}
            >
                {percentage}<span style={{ fontSize: '0.6em', opacity: 0.6 }}>%</span>
            </div>
        </div>
    );
}
