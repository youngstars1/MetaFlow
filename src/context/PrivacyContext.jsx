import { createContext, useContext, useState, useCallback } from 'react';

const PrivacyContext = createContext();

export function PrivacyProvider({ children }) {
    const [isPrivate, setIsPrivate] = useState(() => {
        try { return localStorage.getItem('metaflow_privacy') === 'true'; } catch { return false; }
    });

    const togglePrivacy = useCallback(() => {
        setIsPrivate(prev => {
            const next = !prev;
            localStorage.setItem('metaflow_privacy', String(next));
            return next;
        });
    }, []);

    return (
        <PrivacyContext.Provider value={{ isPrivate, togglePrivacy }}>
            {children}
        </PrivacyContext.Provider>
    );
}

export function usePrivacy() {
    const ctx = useContext(PrivacyContext);
    if (!ctx) throw new Error('usePrivacy must be used within PrivacyProvider');
    return ctx;
}

/**
 * Format amount with privacy mode — blurs money values
 */
export function PrivacyAmount({ children, className = '', style = {} }) {
    const { isPrivate } = usePrivacy();

    if (isPrivate) {
        return (
            <span
                className={className}
                style={{
                    ...style,
                    filter: 'blur(8px)',
                    userSelect: 'none',
                    cursor: 'default',
                    transition: 'filter 0.3s ease',
                }}
                aria-hidden="true"
            >
                {children}
            </span>
        );
    }

    return <span className={className} style={style}>{children}</span>;
}
