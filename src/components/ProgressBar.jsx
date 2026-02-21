import { getProgressPercentage } from '../utils/helpers';

export default function ProgressBar({ current, target, label, large = false }) {
    const percentage = getProgressPercentage(current, target);

    return (
        <div className={`progress-bar-container ${large ? 'progress-bar-large' : ''}`}>
            {label && (
                <div className="progress-bar-label">
                    <span className="progress-bar-text">{label}</span>
                    <span className="progress-bar-percentage">{percentage}%</span>
                </div>
            )}
            <div className="progress-bar-track">
                <div
                    className="progress-bar-fill"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
